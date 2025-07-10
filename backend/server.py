from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import os
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

app = FastAPI(title="Real Estate Investment Sourcing API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
MONGO_URL = os.environ.get("MONGO_URL")
if MONGO_URL:
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.real_estate_db
else:
    client = None
    db = None

# Mock data for realistic properties
MOCK_PROPERTIES = [
    {
        "id": str(uuid.uuid4()),
        "address": "1234 Peachtree St, Atlanta, GA 30309",
        "city": "Atlanta",
        "state": "GA",
        "zipcode": "30309",
        "price": 185000,
        "bedrooms": 3,
        "bathrooms": 2,
        "sqft": 1450,
        "property_type": "Single Family",
        "year_built": 1995,
        "estimated_rent": 2100,
        "estimated_arv": 280000,
        "estimated_repair_cost": 35000,
        "neighborhood_quality": "B+",
        "days_on_market": 45,
        "property_taxes": 3200,
        "hoa_fees": 0,
        "image_url": "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=500",
        "description": "Solid investment opportunity in growing Atlanta market. Needs cosmetic updates.",
        "listing_agent": "Sarah Johnson",
        "listing_date": "2024-02-15"
    },
    {
        "id": str(uuid.uuid4()),
        "address": "5678 Desert View Dr, Phoenix, AZ 85016",
        "city": "Phoenix",
        "state": "AZ",
        "zipcode": "85016",
        "price": 320000,
        "bedrooms": 4,
        "bathrooms": 3,
        "sqft": 2100,
        "property_type": "Single Family",
        "year_built": 2005,
        "estimated_rent": 2800,
        "estimated_arv": 420000,
        "estimated_repair_cost": 25000,
        "neighborhood_quality": "A-",
        "days_on_market": 22,
        "property_taxes": 4500,
        "hoa_fees": 120,
        "image_url": "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=500",
        "description": "Modern home in desirable Phoenix suburb. Great rental potential.",
        "listing_agent": "Mike Rodriguez",
        "listing_date": "2024-02-28"
    },
    {
        "id": str(uuid.uuid4()),
        "address": "9012 Maple Ave, Cleveland, OH 44102",
        "city": "Cleveland",
        "state": "OH",
        "zipcode": "44102",
        "price": 75000,
        "bedrooms": 2,
        "bathrooms": 1,
        "sqft": 950,
        "property_type": "Single Family",
        "year_built": 1955,
        "estimated_rent": 1200,
        "estimated_arv": 140000,
        "estimated_repair_cost": 20000,
        "neighborhood_quality": "C+",
        "days_on_market": 67,
        "property_taxes": 1800,
        "hoa_fees": 0,
        "image_url": "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500",
        "description": "Excellent cash flow opportunity in established Cleveland neighborhood.",
        "listing_agent": "Linda Thompson",
        "listing_date": "2024-01-20"
    },
    {
        "id": str(uuid.uuid4()),
        "address": "3456 Oak Street, Memphis, TN 38104",
        "city": "Memphis",
        "state": "TN",
        "zipcode": "38104",
        "price": 95000,
        "bedrooms": 3,
        "bathrooms": 2,
        "sqft": 1200,
        "property_type": "Single Family",
        "year_built": 1978,
        "estimated_rent": 1400,
        "estimated_arv": 160000,
        "estimated_repair_cost": 15000,
        "neighborhood_quality": "B",
        "days_on_market": 35,
        "property_taxes": 2100,
        "hoa_fees": 0,
        "image_url": "https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=500",
        "description": "Great starter investment property with solid rental history.",
        "listing_agent": "Robert Davis",
        "listing_date": "2024-02-10"
    },
    {
        "id": str(uuid.uuid4()),
        "address": "7890 Pine Ridge Rd, Jacksonville, FL 32225",
        "city": "Jacksonville",
        "state": "FL",
        "zipcode": "32225",
        "price": 245000,
        "bedrooms": 3,
        "bathrooms": 2,
        "sqft": 1650,
        "property_type": "Single Family",
        "year_built": 2010,
        "estimated_rent": 2200,
        "estimated_arv": 310000,
        "estimated_repair_cost": 12000,
        "neighborhood_quality": "A",
        "days_on_market": 18,
        "property_taxes": 3800,
        "hoa_fees": 85,
        "image_url": "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=500",
        "description": "Move-in ready property in growing Jacksonville market.",
        "listing_agent": "Jennifer Wilson",
        "listing_date": "2024-03-01"
    },
    {
        "id": str(uuid.uuid4()),
        "address": "2468 Sunset Blvd, Birmingham, AL 35209",
        "city": "Birmingham",
        "state": "AL",
        "zipcode": "35209",
        "price": 125000,
        "bedrooms": 4,
        "bathrooms": 2,
        "sqft": 1800,
        "property_type": "Single Family",
        "year_built": 1985,
        "estimated_rent": 1650,
        "estimated_arv": 190000,
        "estimated_repair_cost": 28000,
        "neighborhood_quality": "B-",
        "days_on_market": 52,
        "property_taxes": 2400,
        "hoa_fees": 0,
        "image_url": "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=500",
        "description": "Spacious home with great flip potential in Birmingham market.",
        "listing_agent": "David Brown",
        "listing_date": "2024-01-28"
    }
]

# Pydantic models
class PropertyFilter(BaseModel):
    min_price: Optional[int] = None
    max_price: Optional[int] = None
    city: Optional[str] = None
    state: Optional[str] = None
    min_bedrooms: Optional[int] = None
    property_type: Optional[str] = None
    investment_type: Optional[str] = None  # "flip", "rental", "both"

class UserCriteria(BaseModel):
    id: Optional[str] = None
    email: str
    name: str
    criteria: PropertyFilter
    alert_enabled: bool = True

class InvestmentAnalysis(BaseModel):
    property_id: str
    flip_analysis: dict
    rental_analysis: dict
    recommendation: str

def calculate_flip_analysis(property_data):
    """Calculate flip investment analysis using 70% rule"""
    price = property_data["price"]
    arv = property_data["estimated_arv"]
    repair_cost = property_data["estimated_repair_cost"]
    
    # 70% rule: Max purchase price = (ARV * 0.70) - Repair costs
    max_purchase_price = (arv * 0.70) - repair_cost
    
    # Calculate potential profit
    total_investment = price + repair_cost
    potential_profit = arv - total_investment
    profit_margin = (potential_profit / total_investment) * 100 if total_investment > 0 else 0
    
    # Additional costs (estimated)
    closing_costs = price * 0.02  # 2% of purchase price
    carrying_costs = price * 0.01  # 1% for holding costs
    total_costs = total_investment + closing_costs + carrying_costs
    
    net_profit = arv - total_costs
    roi = (net_profit / total_costs) * 100 if total_costs > 0 else 0
    
    meets_70_rule = price <= max_purchase_price
    
    return {
        "purchase_price": price,
        "arv": arv,
        "repair_cost": repair_cost,
        "max_purchase_price": max_purchase_price,
        "meets_70_rule": meets_70_rule,
        "total_investment": total_investment,
        "potential_profit": potential_profit,
        "profit_margin": round(profit_margin, 2),
        "estimated_roi": round(roi, 2),
        "net_profit": round(net_profit, 2),
        "recommendation": "Good Flip" if meets_70_rule and roi > 15 else "Review Required"
    }

def calculate_rental_analysis(property_data):
    """Calculate rental investment analysis using 1% rule"""
    price = property_data["price"]
    estimated_rent = property_data["estimated_rent"]
    property_taxes = property_data["property_taxes"]
    hoa_fees = property_data["hoa_fees"]
    
    # 1% rule: Monthly rent should be >= 1% of purchase price
    one_percent_threshold = price * 0.01
    meets_1_percent_rule = estimated_rent >= one_percent_threshold
    
    # Monthly expenses (estimated)
    monthly_taxes = property_taxes / 12
    monthly_hoa = hoa_fees
    insurance = price * 0.005 / 12  # 0.5% annually
    maintenance = estimated_rent * 0.10  # 10% of rent
    vacancy = estimated_rent * 0.05  # 5% vacancy allowance
    property_management = estimated_rent * 0.08  # 8% if using PM
    
    total_monthly_expenses = monthly_taxes + monthly_hoa + insurance + maintenance + vacancy + property_management
    
    # Cash flow analysis
    monthly_cash_flow = estimated_rent - total_monthly_expenses
    annual_cash_flow = monthly_cash_flow * 12
    
    # ROI calculations
    cash_on_cash_return = (annual_cash_flow / price) * 100
    cap_rate = (annual_cash_flow / price) * 100
    
    # Rent-to-price ratio
    rent_to_price_ratio = (estimated_rent / price) * 100
    
    return {
        "purchase_price": price,
        "monthly_rent": estimated_rent,
        "one_percent_threshold": round(one_percent_threshold, 2),
        "meets_1_percent_rule": meets_1_percent_rule,
        "monthly_expenses": round(total_monthly_expenses, 2),
        "monthly_cash_flow": round(monthly_cash_flow, 2),
        "annual_cash_flow": round(annual_cash_flow, 2),
        "cash_on_cash_return": round(cash_on_cash_return, 2),
        "cap_rate": round(cap_rate, 2),
        "rent_to_price_ratio": round(rent_to_price_ratio, 2),
        "recommendation": "Good Rental" if meets_1_percent_rule and cash_on_cash_return > 8 else "Review Required"
    }

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "Real Estate Investment API is running"}

@app.get("/api/properties")
async def get_properties(
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    min_bedrooms: Optional[int] = None,
    property_type: Optional[str] = None,
    investment_type: Optional[str] = None
):
    """Get properties with optional filtering"""
    filtered_properties = MOCK_PROPERTIES.copy()
    
    # Apply filters
    if min_price:
        filtered_properties = [p for p in filtered_properties if p["price"] >= min_price]
    if max_price:
        filtered_properties = [p for p in filtered_properties if p["price"] <= max_price]
    if city:
        filtered_properties = [p for p in filtered_properties if p["city"].lower() == city.lower()]
    if state:
        filtered_properties = [p for p in filtered_properties if p["state"].lower() == state.lower()]
    if min_bedrooms:
        filtered_properties = [p for p in filtered_properties if p["bedrooms"] >= min_bedrooms]
    if property_type:
        filtered_properties = [p for p in filtered_properties if p["property_type"].lower() == property_type.lower()]
    
    # Add investment analysis to each property
    for prop in filtered_properties:
        flip_analysis = calculate_flip_analysis(prop)
        rental_analysis = calculate_rental_analysis(prop)
        
        prop["flip_analysis"] = flip_analysis
        prop["rental_analysis"] = rental_analysis
        
        # Overall recommendation
        if investment_type == "flip":
            prop["investment_recommendation"] = flip_analysis["recommendation"]
        elif investment_type == "rental":
            prop["investment_recommendation"] = rental_analysis["recommendation"]
        else:
            # Both - recommend based on better option
            flip_good = flip_analysis["meets_70_rule"] and flip_analysis["estimated_roi"] > 15
            rental_good = rental_analysis["meets_1_percent_rule"] and rental_analysis["cash_on_cash_return"] > 8
            
            if flip_good and rental_good:
                prop["investment_recommendation"] = "Good for Both"
            elif flip_good:
                prop["investment_recommendation"] = "Good Flip"
            elif rental_good:
                prop["investment_recommendation"] = "Good Rental"
            else:
                prop["investment_recommendation"] = "Review Required"
    
    return {"properties": filtered_properties, "count": len(filtered_properties)}

@app.get("/api/properties/{property_id}")
async def get_property(property_id: str):
    """Get detailed property information"""
    property_data = next((p for p in MOCK_PROPERTIES if p["id"] == property_id), None)
    
    if not property_data:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Add detailed analysis
    flip_analysis = calculate_flip_analysis(property_data)
    rental_analysis = calculate_rental_analysis(property_data)
    
    property_data["flip_analysis"] = flip_analysis
    property_data["rental_analysis"] = rental_analysis
    
    return property_data

@app.post("/api/analysis")
async def analyze_property(property_id: str):
    """Get detailed investment analysis for a property"""
    property_data = next((p for p in MOCK_PROPERTIES if p["id"] == property_id), None)
    
    if not property_data:
        raise HTTPException(status_code=404, detail="Property not found")
    
    flip_analysis = calculate_flip_analysis(property_data)
    rental_analysis = calculate_rental_analysis(property_data)
    
    # Determine overall recommendation
    flip_good = flip_analysis["meets_70_rule"] and flip_analysis["estimated_roi"] > 15
    rental_good = rental_analysis["meets_1_percent_rule"] and rental_analysis["cash_on_cash_return"] > 8
    
    if flip_good and rental_good:
        recommendation = "Excellent opportunity for both flipping and rental"
    elif flip_good:
        recommendation = "Strong flip opportunity"
    elif rental_good:
        recommendation = "Good rental property"
    else:
        recommendation = "Requires careful analysis - may not meet standard investment criteria"
    
    return {
        "property_id": property_id,
        "property_address": property_data["address"],
        "flip_analysis": flip_analysis,
        "rental_analysis": rental_analysis,
        "overall_recommendation": recommendation
    }

@app.post("/api/user-criteria")
async def save_user_criteria(criteria: UserCriteria):
    """Save user criteria for property alerts"""
    if not criteria.id:
        criteria.id = str(uuid.uuid4())
    
    # In a real app, this would save to database
    # For now, we'll just return the criteria
    return {
        "message": "Criteria saved successfully",
        "criteria_id": criteria.id,
        "criteria": criteria.dict()
    }

@app.get("/api/markets")
async def get_markets():
    """Get available markets/cities"""
    markets = {}
    for prop in MOCK_PROPERTIES:
        city_state = f"{prop['city']}, {prop['state']}"
        if city_state not in markets:
            markets[city_state] = {
                "city": prop["city"],
                "state": prop["state"],
                "property_count": 0,
                "avg_price": 0,
                "avg_rent": 0
            }
        markets[city_state]["property_count"] += 1
    
    # Calculate averages
    for market in markets.values():
        city_props = [p for p in MOCK_PROPERTIES if p["city"] == market["city"]]
        market["avg_price"] = sum(p["price"] for p in city_props) // len(city_props)
        market["avg_rent"] = sum(p["estimated_rent"] for p in city_props) // len(city_props)
    
    return {"markets": list(markets.values())}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)