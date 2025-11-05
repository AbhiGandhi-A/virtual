# This server processes user history sent by the client (widgets.js) and
# fetches real product data from Shopify using the Storefront API.

from flask import Flask, request, jsonify
from collections import Counter
import random
from flask_cors import CORS
import requests
import os
import json 

# --- FLASK APP SETUP ---
app = Flask(__name__)
# Enable CORS for cross-origin requests from your Shopify storefront
CORS(app)

# --- CONFIGURATION (Requires Environment Variables on Render) ---
SHOPIFY_STORE_DOMAIN = os.environ.get('SHOPIFY_STORE_DOMAIN', 'abhi-dynamic-dreamz.myshopify.com')
SHOPIFY_STOREFRONT_TOKEN = os.environ.get('SHOPIFY_STOREFRONT_TOKEN', '87691e8132975f1169de072e3eb0426e')

# Storefront API endpoint
SHOPIFY_GRAPHQL_URL = f"https://{SHOPIFY_STORE_DOMAIN}/api/2023-10/graphql.json"

# --- SHOPIFY API INTERACTION ---

def fetch_shopify_products_for_recommendation(limit=100):
    """
    Fetches a list of products suitable for recommendation using the Storefront API.
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
        response = requests.post(SHOPIFY_GRAPHQL_URL, headers=headers, json=payload, timeout=10)
        response.raise_for_status() 
        data = response.json()
        
        if 'errors' in data:
            print(f"Shopify GraphQL Error: {data['errors']}")
            return {}

        product_catalog = {}
        for edge in data['data']['products']['edges']:
            node = edge['node']
            
            raw_product_id = node['id'].split('/')[-1]
            variant_edges = node['variants']['edges']
            raw_variant_id = None
            
            if variant_edges:
                global_variant_id = variant_edges[0]['node']['id']
                raw_variant_id = global_variant_id.split('/')[-1]
                
            if not raw_variant_id:
                print(f"Warning: Product {raw_product_id} has no accessible variants. Skipping.")
                continue

            product_catalog[raw_product_id] = {
                "id": raw_product_id, 
                "defaultVariantId": raw_variant_id, 
                "name": node['title'],
                # Sanitize the category
                "category": node['productType'].strip() or "Uncategorized", 
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
    and the current product category, heavily prioritizing category match.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data received"}), 400

        # currentProductId is the raw numeric Product ID
        current_product_id = data.get("currentProductId")
        # History is sent from local storage
        history = data.get("history", []) 
        
        # --- 1. Load Data and Check ---
        PRODUCT_CATALOG = fetch_shopify_products_for_recommendation(limit=100)
        
        if not PRODUCT_CATALOG:
            return jsonify({"recommendations": [], "message": "Failed to load catalog."}), 200

        # Get details of the current product
        current_product = PRODUCT_CATALOG.get(current_product_id)
        current_product_category = current_product.get("category") if current_product else None
        
        # If the current product is missing or uncategorized, we can't recommend matches
        if not current_product_category or current_product_category == "Uncategorized":
            # Fallback: Just return a few random items (excluding current)
            candidates = [pid for pid in PRODUCT_CATALOG.keys() if pid != current_product_id]
            random.shuffle(candidates)
            random_recos = [PRODUCT_CATALOG[pid].copy() for pid in candidates[:3]]
            return jsonify({
                "recommendations": random_recos, 
                "message": "No specific category for current item. Returning random."
            }), 200


        # --- 2. Analyze User History for Category Preference ---
        viewed_products = [item['productId'] for item in history if item['type'] == 'view']
        clicked_products = [item['productId'] for item in history if item['type'] == 'click']
        
        # Give more weight to clicked products
        all_relevant_products = clicked_products * 3 + viewed_products
        product_counts = Counter(all_relevant_products)
        
        # Determine preferred category based *mostly* on the current product category
        preferred_category = current_product_category
        if product_counts:
            most_frequent_id = product_counts.most_common(1)[0][0]
            history_category = PRODUCT_CATALOG.get(most_frequent_id, {}).get("category")
            # If the user's history shows a strong preference, maybe switch, but generally stick to current context
            if history_category and history_category != "Uncategorized":
                # For simplicity, we stick to current_product_category to ensure clothing matches clothing
                pass 
        

        # --- 3. Filter Candidate Recommendations ---
        candidates = []
        for pid, product in PRODUCT_CATALOG.items():
            # Exclude the current product, recently clicked, AND products that don't match the preferred category
            if (pid != current_product_id and 
                pid not in clicked_products and
                product['category'] == preferred_category): # STRICT CATEGORY MATCH
                
                candidates.append(pid)
        
        # If strict matching fails, relax the filter to complementary items
        if not candidates:
            # Relaxed filter: Allow complementary categories
            complementary_categories = {
                "Shirts": ["Jackets", "Pants", "T-Shirts", "Sweaters"],
                "Jackets": ["Shirts", "Pants", "T-Shirts", "Sweaters"],
                "Pants": ["Shirts", "Jackets", "T-Shirts", "Sweaters"],
            }.get(current_product_category, [current_product_category]) # Default to self-category

            for pid, product in PRODUCT_CATALOG.items():
                if (pid != current_product_id and 
                    pid not in clicked_products and
                    product['category'] in complementary_categories):
                    candidates.append(pid)
        
        
        # --- 4. Score and Rank Candidates ---
        scored_candidates = []
        for pid in candidates:
            product = PRODUCT_CATALOG.get(pid)
            if product:
                score = 0
                
                # High score for perfect category match (even after filtering, this helps)
                if product['category'] == current_product_category:
                    score += 20 
                
                # Secondary boost for complementary categories (if we used the relaxed filter)
                elif product['category'] != current_product_category and product['category'] in complementary_categories:
                    score += 10 
                
                # Price Boost (to prioritize higher value items)
                score += product['price'] / 50
                
                # Randomness for variety
                score += random.uniform(0, 1)

                scored_candidates.append((score, pid))

        # Sort by score (highest first)
        scored_candidates.sort(key=lambda x: x[0], reverse=True)
        
        # --- 5. Select Final Recommendations (Max 3) ---
        final_recommendation_ids = [pid for score, pid in scored_candidates][:3]

        # --- 6. Format Output ---
        recommendations = []
        for pid in final_recommendation_ids:
            recommendations.append(PRODUCT_CATALOG[pid].copy())

        return jsonify({
            "recommendations": recommendations, 
            "message": f"Recommendations based on preferred category: {preferred_category} from live Shopify data."
        }), 200

    except Exception as e:
        print(f"Critical Error generating recommendations: {e}")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=os.environ.get('PORT', 5001))
