# This server processes user history sent by the client (widgets.js) and
# fetches real product data from Shopify using the Storefront API.
from flask import Flask, request, jsonify
from collections import Counter
import random
from flask_cors import CORS
import requests
import os
import json # Used for debugging/pretty-printing the Shopify API response

app = Flask(__name__)
CORS(app)

# --- CONFIGURATION (Requires Environment Variables on Render) ---
SHOPIFY_STORE_DOMAIN = os.environ.get('SHOPIFY_STORE_DOMAIN', 'your-store-name.myshopify.com')
SHOPIFY_STOREFRONT_TOKEN = os.environ.get('SHOPIFY_STOREFRONT_TOKEN', 'your-storefront-token')

# Storefront API endpoint
SHOPIFY_GRAPHQL_URL = f"https://{SHOPIFY_STORE_DOMAIN}/api/2023-10/graphql.json"

# --- SHOPIFY API INTERACTION ---

def fetch_shopify_products_for_recommendation(limit=10):
    """
    Fetches a list of products suitable for recommendation using the Storefront API,
    including the default variant ID required for cart submission.
    
    Returns: A dictionary mapping Product ID (string) to product data.
    """
    if not SHOPIFY_STOREFRONT_TOKEN or not SHOPIFY_STORE_DOMAIN:
        print("ERROR: Shopify API credentials missing. Cannot fetch real data.")
        return {}
        
    # GraphQL query: Added 'variants' to capture the default variant ID (first one)
    query = """
    query RecommendedProducts($num: Int!) {
      products(first: $num, sortKey: UPDATED_AT, reverse: true) {
        edges {
          node {
            id
            title
            productType
            featuredImage {
              url
            }
            priceRange {
              maxVariantPrice {
                amount
              }
            }
            # *** CRITICAL ADDITION: Fetch the variants, focusing on the first one (default) ***
            variants(first: 1) {
                edges {
                    node {
                        id
                    }
                }
            }
          }
        }
      }
    }
    """
    
    headers = {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN
    }
    
    payload = {
        "query": query,
        "variables": {"num": limit}
    }
    
    try:
        response = requests.post(SHOPIFY_GRAPHQL_URL, headers=headers, json=payload, timeout=10)
        response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
        data = response.json()
        
        product_catalog = {}
        for edge in data['data']['products']['edges']:
            node = edge['node']
            
            # 1. Extract the raw numeric Product ID (for internal lookup/client Product ID)
            raw_product_id = node['id'].split('/')[-1]
            
            # 2. Extract the raw numeric Variant ID (for the client's cart API payload)
            variant_edges = node['variants']['edges']
            raw_variant_id = None
            if variant_edges:
                # Get the global ID of the first variant (assumed default/primary)
                global_variant_id = variant_edges[0]['node']['id']
                # Extract the raw numeric Variant ID
                raw_variant_id = global_variant_id.split('/')[-1]
                
            if not raw_variant_id:
                print(f"Warning: Product {raw_product_id} has no accessible variants. Skipping.")
                continue


            product_catalog[raw_product_id] = {
                "id": raw_product_id, # Product ID
                "defaultVariantId": raw_variant_id, # *** NEW: Variant ID for cart submission ***
                "name": node['title'],
                "category": node['productType'] or "Uncategorized",
                # Use the max price of all variants as the price
                "price": float(node['priceRange']['maxVariantPrice']['amount']),
                "image": node['featuredImage']['url'] if node['featuredImage'] else "https://placehold.co/100x100/CCCCCC/000?text=No+Image"
            }
        
        print(f"Successfully fetched {len(product_catalog)} products from Shopify.")
        return product_catalog
        
    except requests.exceptions.RequestException as e:
        print(f"Shopify API Request Error: {e}")
        return {}
    except Exception as e:
        print(f"Error processing Shopify data: {e}")
        # In a real app, you might fall back to a cached catalog here
        return {}


@app.route('/get-recommendations', methods=['POST'])
def get_recommendations():
    """
    Generates personalized recommendations based on the user's 24-hour interaction history.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data received"}), 400

        current_product_id = data.get("currentProductId")
        history = data.get("history", [])

        # Fetch the live product catalog from Shopify (limit to 100 products for performance)
        PRODUCT_CATALOG = fetch_shopify_products_for_recommendation(limit=100)
        
        if not PRODUCT_CATALOG:
            # Fallback when the API fails
            return jsonify({"recommendations": [], "message": "Failed to load product catalog from Shopify."}), 200

        # --- 1. Analyze User History (Logic remains the same) ---
        viewed_products = [item['productId'] for item in history if item['type'] == 'view']
        clicked_products = [item['productId'] for item in history if item['type'] == 'click']
        
        all_relevant_products = clicked_products * 3 + viewed_products
        product_counts = Counter(all_relevant_products)
        
        preferred_category = None
        current_product_category = PRODUCT_CATALOG.get(current_product_id, {}).get("category")
        
        if product_counts:
            most_frequent_id = product_counts.most_common(1)[0][0]
            # Ensure the most frequent product ID exists in the fetched catalog before using its category
            preferred_category = PRODUCT_CATALOG.get(most_frequent_id, {}).get("category", "Uncategorized")
        
        if not preferred_category or preferred_category == "Uncategorized":
            # Fallback to general category or the category of the current product
            category_options = list(set(p['category'] for p in PRODUCT_CATALOG.values() if p['category'] != 'Uncategorized'))
            if current_product_category and current_product_category != 'Uncategorized':
                 preferred_category = current_product_category
            elif category_options:
                 preferred_category = random.choice(category_options)
            else:
                 preferred_category = "Uncategorized" # Final fallback

        # --- 2. Filter Candidate Recommendations ---
        candidates = []
        for pid, product in PRODUCT_CATALOG.items():
            # Exclude the current product and products already recently clicked
            if pid != current_product_id and pid not in clicked_products:
                candidates.append(pid)

        # --- 3. Score and Rank Candidates ---
        scored_candidates = []
        for pid in candidates:
            product = PRODUCT_CATALOG.get(pid)
            if product:
                score = 0
                
                # Category Match Boost
                if product['category'] == preferred_category:
                    score += 10 
                
                # Complementary Item Logic (example: recommend a T-shirt if the current product is a Blazer)
                if current_product_category == "Jackets" and product['category'] in ["Shirts", "T-Shirts", "Sweaters"]:
                    score += 5
                
                # Price Boost (higher margin/value items)
                score += product['price'] / 50
                
                # Randomness for variety
                score += random.uniform(0, 1)

                scored_candidates.append((score, pid))

        # Sort by score (highest first)
        scored_candidates.sort(key=lambda x: x[0], reverse=True)
        
        # --- 4. Select Final Recommendations (Max 3) ---
        final_recommendation_ids = [pid for score, pid in scored_candidates][:3]

        # --- 5. Format Output ---
        recommendations = []
        for pid in final_recommendation_ids:
            # We copy the entire product dict which already contains 'defaultVariantId'
            product = PRODUCT_CATALOG[pid].copy() 
            recommendations.append(product)

        return jsonify({"recommendations": recommendations, "message": f"Recommendations based on preferred category: {preferred_category} from live Shopify data."}), 200

    except Exception as e:
        # Catch any unexpected errors during processing
        print(f"Critical Error generating recommendations: {e}")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

if __name__ == '__main__':
    # Running on port 5001 for local testing.
    app.run(debug=True, host='0.0.0.0', port=5001)
