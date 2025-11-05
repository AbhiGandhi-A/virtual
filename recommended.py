# This server processes user history sent by the client (widgets.js) and
# fetches real product data from Shopify using the Storefront API.

from flask import Flask, request, jsonify
from collections import Counter
import random
from flask_cors import CORS
import requests
import os
import json # Used for debugging/pretty-printing/serializing data

# --- FLASK APP SETUP ---
app = Flask(__name__)
# Enable CORS for cross-origin requests from your Shopify storefront
CORS(app)

# --- CONFIGURATION (Requires Environment Variables on Render) ---
# NOTE: The default values here should be replaced with actual secure keys
SHOPIFY_STORE_DOMAIN = os.environ.get('SHOPIFY_STORE_DOMAIN', 'abhi-dynamic-dreamz.myshopify.com')
SHOPIFY_STOREFRONT_TOKEN = os.environ.get('SHOPIFY_STOREFRONT_TOKEN', '87691e8132975f1169de072e3eb0426e')

# Storefront API endpoint
SHOPIFY_GRAPHQL_URL = f"https://{SHOPIFY_STORE_DOMAIN}/api/2023-10/graphql.json"

# --- SHOPIFY API INTERACTION ---

def fetch_shopify_products_for_recommendation(limit=100):
    """
    Fetches a list of products suitable for recommendation using the Storefront API,
    including the default variant ID required for cart submission.
    
    Returns: A dictionary mapping raw numeric Product ID (string) to product data.
    """
    if not SHOPIFY_STOREFRONT_TOKEN or 'your-storefront-token' in SHOPIFY_STOREFRONT_TOKEN:
        print("ERROR: Shopify API credentials are missing or default. Cannot fetch real data.")
        return {}
        
    # GraphQL query: Fetches critical data, including the first variant's global ID.
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
            # CRITICAL: Fetch the variants, focusing on the first one (default)
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
        # Use a reasonable timeout for external API calls
        response = requests.post(SHOPIFY_GRAPHQL_URL, headers=headers, json=payload, timeout=10)
        response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
        data = response.json()
        
        # Check for GraphQL errors
        if 'errors' in data:
            print(f"Shopify GraphQL Error: {data['errors']}")
            return {}

        product_catalog = {}
        for edge in data['data']['products']['edges']:
            node = edge['node']
            
            # 1. Extract the raw numeric Product ID
            raw_product_id = node['id'].split('/')[-1]
            
            # 2. Extract the raw numeric Variant ID
            variant_edges = node['variants']['edges']
            raw_variant_id = None
            if variant_edges:
                # Get the global ID of the first variant
                global_variant_id = variant_edges[0]['node']['id']
                # Extract the raw numeric Variant ID (required for client's cart API)
                raw_variant_id = global_variant_id.split('/')[-1]
                
            if not raw_variant_id:
                # Skip products that can't be added to cart (no variants)
                print(f"Warning: Product {raw_product_id} has no accessible variants. Skipping.")
                continue

            product_catalog[raw_product_id] = {
                "id": raw_product_id, 
                "defaultVariantId": raw_variant_id, # Crucial for the client-side cart API
                "name": node['title'],
                "category": node['productType'] or "Uncategorized",
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
        return {}


# --- RECOMMENDATION LOGIC ---

@app.route('/get-recommendations', methods=['POST'])
def get_recommendations():
    """
    Generates personalized recommendations based on the user's interaction history 
    and the current product category.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data received"}), 400

        # Note: currentProductId is expected to be the raw numeric Product ID
        current_product_id = data.get("currentProductId")
        history = data.get("history", [])

        # Fetch the live product catalog from Shopify
        PRODUCT_CATALOG = fetch_shopify_products_for_recommendation(limit=100)
        
        if not PRODUCT_CATALOG:
            return jsonify({"recommendations": [], "message": "Failed to load product catalog from Shopify. Check API key."}), 200

        # --- 1. Analyze User History ---
        viewed_products = [item['productId'] for item in history if item['type'] == 'view']
        clicked_products = [item['productId'] for item in history if item['type'] == 'click']
        
        # Give more weight to clicked products
        all_relevant_products = clicked_products * 3 + viewed_products
        product_counts = Counter(all_relevant_products)
        
        preferred_category = None
        current_product_category = PRODUCT_CATALOG.get(current_product_id, {}).get("category")
        
        # Determine preferred category based on history or current product
        if product_counts:
            most_frequent_id = product_counts.most_common(1)[0][0]
            preferred_category = PRODUCT_CATALOG.get(most_frequent_id, {}).get("category")
        
        if not preferred_category or preferred_category == "Uncategorized":
            category_options = list(set(p['category'] for p in PRODUCT_CATALOG.values() if p['category'] != 'Uncategorized'))
            if current_product_category and current_product_category != 'Uncategorized':
                preferred_category = current_product_category
            elif category_options:
                preferred_category = random.choice(category_options)
            else:
                preferred_category = "Uncategorized"

        # --- 2. Filter Candidate Recommendations ---
        candidates = []
        for pid, product in PRODUCT_CATALOG.items():
            # Exclude the current product and products recently clicked
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
                
                # Complementary Item Logic (Example)
                if current_product_category == "Jackets" and product['category'] in ["Shirts", "T-Shirts", "Sweaters"]:
                    score += 5
                
                # Price Boost (to prioritize higher value items)
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
            # Send the complete product data, including the essential 'defaultVariantId'
            recommendations.append(PRODUCT_CATALOG[pid].copy())

        return jsonify({"recommendations": recommendations, "message": f"Recommendations based on preferred category: {preferred_category} from live Shopify data."}), 200

    except Exception as e:
        print(f"Critical Error generating recommendations: {e}")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

if __name__ == '__main__':
    # Running on port 5001 for local testing.
    # On Render, the host will be '0.0.0.0' and the port will be set by the environment.
    app.run(debug=True, host='0.0.0.0', port=os.environ.get('PORT', 5001))
