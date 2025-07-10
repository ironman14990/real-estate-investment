import requests
import unittest
import json
from typing import Dict, Any, List

class RealEstateAPITester:
    def __init__(self, base_url="https://b06a24e3-74ac-4421-96cc-195f842f4dda.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.property_id = None  # Will store a property ID for detailed tests

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return response.json()
                except:
                    return {"raw_response": response.text}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text}")
                return {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return {}

    def test_health_check(self) -> bool:
        """Test the health check endpoint"""
        response = self.run_test(
            "Health Check",
            "GET",
            "/api/health",
            200
        )
        return "status" in response and response["status"] == "healthy"

    def test_get_properties(self, filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Test getting properties with optional filters"""
        endpoint = "/api/properties"
        if filters:
            query_params = "&".join([f"{k}={v}" for k, v in filters.items() if v])
            if query_params:
                endpoint = f"{endpoint}?{query_params}"
        
        response = self.run_test(
            f"Get Properties{' with filters' if filters else ''}",
            "GET",
            endpoint,
            200
        )
        
        properties = response.get("properties", [])
        print(f"Found {len(properties)} properties")
        
        # Store a property ID for later tests if available
        if properties and not self.property_id:
            self.property_id = properties[0]["id"]
            
        return properties

    def test_property_details(self, property_id: str = None) -> Dict[str, Any]:
        """Test getting detailed property information"""
        if not property_id and not self.property_id:
            print("❌ No property ID available for testing")
            return {}
            
        pid = property_id or self.property_id
        response = self.run_test(
            "Get Property Details",
            "GET",
            f"/api/properties/{pid}",
            200
        )
        
        return response

    def test_property_analysis(self, property_id: str = None) -> Dict[str, Any]:
        """Test property investment analysis"""
        if not property_id and not self.property_id:
            print("❌ No property ID available for testing")
            return {}
            
        pid = property_id or self.property_id
        response = self.run_test(
            "Property Analysis",
            "POST",
            f"/api/analysis?property_id={pid}",
            200
        )
        
        return response

    def test_markets(self) -> List[Dict[str, Any]]:
        """Test getting available markets"""
        response = self.run_test(
            "Get Markets",
            "GET",
            "/api/markets",
            200
        )
        
        markets = response.get("markets", [])
        print(f"Found {len(markets)} markets")
        return markets

    def test_save_user_criteria(self) -> Dict[str, Any]:
        """Test saving user criteria"""
        data = {
            "email": "test@example.com",
            "name": "Test User",
            "criteria": {
                "min_price": 100000,
                "max_price": 300000,
                "city": "Atlanta",
                "state": "GA",
                "min_bedrooms": 3,
                "investment_type": "both"
            },
            "alert_enabled": True
        }
        
        response = self.run_test(
            "Save User Criteria",
            "POST",
            "/api/user-criteria",
            200,
            data
        )
        
        return response

    def verify_70_percent_rule(self, properties: List[Dict[str, Any]]) -> bool:
        """Verify 70% rule implementation for flipping properties"""
        if not properties:
            print("❌ No properties to verify 70% rule")
            return False
            
        all_correct = True
        for prop in properties:
            if "flip_analysis" not in prop:
                print(f"❌ Property {prop['id']} missing flip analysis")
                all_correct = False
                continue
                
            analysis = prop["flip_analysis"]
            arv = prop["estimated_arv"]
            repair_cost = prop["estimated_repair_cost"]
            
            # 70% rule: Max purchase price = (ARV × 0.70) - Repair costs
            expected_max_price = (arv * 0.70) - repair_cost
            actual_max_price = analysis["max_purchase_price"]
            
            # Allow for small floating point differences
            if abs(expected_max_price - actual_max_price) > 0.01:
                print(f"❌ Property {prop['id']} has incorrect 70% rule calculation")
                print(f"  Expected: {expected_max_price}, Got: {actual_max_price}")
                all_correct = False
            
            # Verify meets_70_rule flag
            expected_meets_rule = prop["price"] <= expected_max_price
            if expected_meets_rule != analysis["meets_70_rule"]:
                print(f"❌ Property {prop['id']} has incorrect meets_70_rule flag")
                print(f"  Expected: {expected_meets_rule}, Got: {analysis['meets_70_rule']}")
                all_correct = False
                
        if all_correct:
            print("✅ 70% rule implementation verified correctly")
            
        return all_correct

    def verify_1_percent_rule(self, properties: List[Dict[str, Any]]) -> bool:
        """Verify 1% rule implementation for rental properties"""
        if not properties:
            print("❌ No properties to verify 1% rule")
            return False
            
        all_correct = True
        for prop in properties:
            if "rental_analysis" not in prop:
                print(f"❌ Property {prop['id']} missing rental analysis")
                all_correct = False
                continue
                
            analysis = prop["rental_analysis"]
            price = prop["price"]
            monthly_rent = prop["estimated_rent"]
            
            # 1% rule: Monthly rent should be >= 1% of purchase price
            expected_threshold = price * 0.01
            actual_threshold = analysis["one_percent_threshold"]
            
            # Allow for small floating point differences
            if abs(expected_threshold - actual_threshold) > 0.01:
                print(f"❌ Property {prop['id']} has incorrect 1% rule calculation")
                print(f"  Expected threshold: {expected_threshold}, Got: {actual_threshold}")
                all_correct = False
            
            # Verify meets_1_percent_rule flag
            expected_meets_rule = monthly_rent >= expected_threshold
            if expected_meets_rule != analysis["meets_1_percent_rule"]:
                print(f"❌ Property {prop['id']} has incorrect meets_1_percent_rule flag")
                print(f"  Expected: {expected_meets_rule}, Got: {analysis['meets_1_percent_rule']}")
                all_correct = False
                
        if all_correct:
            print("✅ 1% rule implementation verified correctly")
            
        return all_correct

    def run_all_tests(self) -> None:
        """Run all API tests"""
        print("🚀 Starting Real Estate Investment API Tests")
        
        # Test health check
        health_ok = self.test_health_check()
        if not health_ok:
            print("❌ Health check failed, stopping tests")
            return
            
        # Test getting all properties
        properties = self.test_get_properties()
        
        # Test filtering properties
        filtered_props = self.test_get_properties({
            "min_price": 100000,
            "max_price": 300000,
            "city": "Atlanta",
            "min_bedrooms": 3
        })
        
        # Test investment type filtering
        flip_props = self.test_get_properties({"investment_type": "flip"})
        rental_props = self.test_get_properties({"investment_type": "rental"})
        
        # Test property details
        if self.property_id:
            property_details = self.test_property_details()
            
            # Test property analysis
            analysis = self.test_property_analysis()
        
        # Test markets
        markets = self.test_markets()
        
        # Test saving user criteria
        criteria_response = self.test_save_user_criteria()
        
        # Verify investment rules
        self.verify_70_percent_rule(properties)
        self.verify_1_percent_rule(properties)
        
        # Print results
        print(f"\n📊 Tests passed: {self.tests_passed}/{self.tests_run}")
        
        if self.tests_passed == self.tests_run:
            print("✅ All API tests passed!")
        else:
            print(f"❌ {self.tests_run - self.tests_passed} tests failed")


if __name__ == "__main__":
    tester = RealEstateAPITester()
    tester.run_all_tests()