import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('properties');
  const [filters, setFilters] = useState({
    min_price: '',
    max_price: '',
    city: '',
    state: '',
    min_bedrooms: '',
    property_type: '',
    investment_type: ''
  });
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [userCriteria, setUserCriteria] = useState({
    email: '',
    name: '',
    criteria: filters,
    alert_enabled: true
  });
  const [dealCalculator, setDealCalculator] = useState({
    purchase_price: '',
    down_payment_percent: '20',
    interest_rate: '7.0',
    loan_term_years: '30',
    monthly_rent: '',
    estimated_expenses: '',
    repair_costs: '',
    arv: ''
  });
  const [calculatorResult, setCalculatorResult] = useState(null);

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    fetchProperties();
    fetchMarkets();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const response = await fetch(`${backendUrl}/api/properties?${queryParams}`);
      const data = await response.json();
      setProperties(data.properties || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarkets = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/market-analysis`);
      const data = await response.json();
      setMarkets(data.markets || []);
    } catch (error) {
      console.error('Error fetching markets:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchProperties();
  };

  const handleSaveUserCriteria = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/user-criteria`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...userCriteria,
          criteria: filters
        })
      });
      
      if (response.ok) {
        alert('Alert criteria saved successfully!');
      }
    } catch (error) {
      console.error('Error saving criteria:', error);
    }
  };

  const handleDealCalculation = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/calculate-deal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          purchase_price: parseFloat(dealCalculator.purchase_price),
          down_payment_percent: parseFloat(dealCalculator.down_payment_percent),
          interest_rate: parseFloat(dealCalculator.interest_rate),
          loan_term_years: parseInt(dealCalculator.loan_term_years),
          monthly_rent: parseFloat(dealCalculator.monthly_rent),
          estimated_expenses: parseFloat(dealCalculator.estimated_expenses),
          repair_costs: parseFloat(dealCalculator.repair_costs) || 0,
          arv: parseFloat(dealCalculator.arv) || null
        })
      });
      
      const result = await response.json();
      setCalculatorResult(result);
    } catch (error) {
      console.error('Error calculating deal:', error);
    }
  };

  const sendTestAlert = async () => {
    if (!userCriteria.email) {
      alert('Please enter an email address first');
      return;
    }
    
    try {
      const response = await fetch(`${backendUrl}/api/send-alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userCriteria.email,
          properties: properties.slice(0, 3) // Send first 3 properties as test
        })
      });
      
      if (response.ok) {
        alert('Test alert sent! Check your email.');
      }
    } catch (error) {
      console.error('Error sending alert:', error);
    }
  };

  const getRecommendationColor = (recommendation) => {
    if (recommendation.includes('Good')) return 'text-green-600 bg-green-100';
    if (recommendation.includes('Review')) return 'text-yellow-600 bg-yellow-100';
    return 'text-blue-600 bg-blue-100';
  };

  const getMarketTypeColor = (marketType) => {
    if (marketType === "Seller's Market") return 'text-red-600 bg-red-100';
    if (marketType === "Buyer's Market") return 'text-green-600 bg-green-100';
    return 'text-blue-600 bg-blue-100';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const PropertyCard = ({ property }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <img 
          src={property.image_url} 
          alt={property.address}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRecommendationColor(property.investment_recommendation || 'Review Required')}`}>
            {property.investment_recommendation || 'Review Required'}
          </span>
        </div>
        <div className="absolute top-2 left-2">
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
            {property.property_type}
            {property.units && ` (${property.units} units)`}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{property.address}</h3>
        <div className="flex justify-between items-center mb-3">
          <span className="text-2xl font-bold text-blue-600">{formatCurrency(property.price)}</span>
          <span className="text-sm text-gray-600">{property.bedrooms} bed • {property.bathrooms} bath</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">Monthly Rent</p>
            <p className="text-lg font-semibold text-green-600">{formatCurrency(property.estimated_rent)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">ARV</p>
            <p className="text-lg font-semibold text-purple-600">{formatCurrency(property.estimated_arv)}</p>
          </div>
        </div>

        {property.market_trends && (
          <div className="mb-3 p-3 bg-gray-50 rounded">
            <h4 className="font-semibold text-sm mb-2">Market Trends</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Appreciation:</span>
                <span className="ml-2 font-semibold text-green-600">{property.market_trends.appreciation_rate}%</span>
              </div>
              <div>
                <span className="text-gray-600">Market:</span>
                <span className={`ml-2 text-xs px-2 py-1 rounded ${getMarketTypeColor(property.market_trends.market_type)}`}>
                  {property.market_trends.market_type}
                </span>
              </div>
            </div>
          </div>
        )}

        {property.flip_analysis && (
          <div className="mb-3 p-3 bg-gray-50 rounded">
            <h4 className="font-semibold text-sm mb-2">Flip Analysis</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">70% Rule:</span>
                <span className={`ml-2 ${property.flip_analysis.meets_70_rule ? 'text-green-600' : 'text-red-600'}`}>
                  {property.flip_analysis.meets_70_rule ? '✓ Pass' : '✗ Fail'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Est. ROI:</span>
                <span className="ml-2 font-semibold">{property.flip_analysis.estimated_roi}%</span>
              </div>
            </div>
          </div>
        )}

        {property.rental_analysis && (
          <div className="mb-3 p-3 bg-gray-50 rounded">
            <h4 className="font-semibold text-sm mb-2">Rental Analysis</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">1% Rule:</span>
                <span className={`ml-2 ${property.rental_analysis.meets_1_percent_rule ? 'text-green-600' : 'text-red-600'}`}>
                  {property.rental_analysis.meets_1_percent_rule ? '✓ Pass' : '✗ Fail'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Cash Flow:</span>
                <span className="ml-2 font-semibold">{formatCurrency(property.rental_analysis.monthly_cash_flow)}/mo</span>
              </div>
            </div>
          </div>
        )}
        
        <button 
          onClick={() => setSelectedProperty(property)}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
        >
          View Details
        </button>
      </div>
    </div>
  );

  const PropertyModal = ({ property, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{property.address}</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <img 
                src={property.image_url} 
                alt={property.address}
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
              
              <div className="space-y-2">
                <p><strong>Price:</strong> {formatCurrency(property.price)}</p>
                <p><strong>Property Type:</strong> {property.property_type}</p>
                {property.units && <p><strong>Units:</strong> {property.units}</p>}
                <p><strong>Bedrooms:</strong> {property.bedrooms}</p>
                <p><strong>Bathrooms:</strong> {property.bathrooms}</p>
                <p><strong>Square Feet:</strong> {property.sqft.toLocaleString()}</p>
                <p><strong>Year Built:</strong> {property.year_built}</p>
                <p><strong>Days on Market:</strong> {property.days_on_market}</p>
                <p><strong>Neighborhood:</strong> {property.neighborhood_quality}</p>
              </div>

              {property.market_trends && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Market Analysis</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Appreciation Rate:</strong> {property.market_trends.appreciation_rate}%</p>
                    <p><strong>Market Type:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${getMarketTypeColor(property.market_trends.market_type)}`}>
                        {property.market_trends.market_type}
                      </span>
                    </p>
                    <p><strong>Price Trend:</strong> {property.market_trends.price_trend}</p>
                    <p><strong>Rental Demand:</strong> {property.market_trends.rental_demand}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3">Flip Analysis</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Purchase Price</p>
                      <p className="font-semibold">{formatCurrency(property.flip_analysis?.purchase_price || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">ARV</p>
                      <p className="font-semibold">{formatCurrency(property.flip_analysis?.arv || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Repair Costs</p>
                      <p className="font-semibold">{formatCurrency(property.flip_analysis?.repair_cost || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Max Purchase (70%)</p>
                      <p className="font-semibold">{formatCurrency(property.flip_analysis?.max_purchase_price || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Estimated ROI</p>
                      <p className="font-semibold text-green-600">{property.flip_analysis?.estimated_roi || 0}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Net Profit</p>
                      <p className="font-semibold">{formatCurrency(property.flip_analysis?.net_profit || 0)}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className={`text-center p-2 rounded ${property.flip_analysis?.meets_70_rule ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {property.flip_analysis?.meets_70_rule ? '✓ Meets 70% Rule' : '✗ Fails 70% Rule'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-3">Rental Analysis</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Monthly Rent</p>
                      <p className="font-semibold">{formatCurrency(property.rental_analysis?.monthly_rent || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">1% Threshold</p>
                      <p className="font-semibold">{formatCurrency(property.rental_analysis?.one_percent_threshold || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Monthly Expenses</p>
                      <p className="font-semibold">{formatCurrency(property.rental_analysis?.monthly_expenses || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Cash Flow</p>
                      <p className="font-semibold">{formatCurrency(property.rental_analysis?.monthly_cash_flow || 0)}/mo</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Cap Rate</p>
                      <p className="font-semibold text-blue-600">{property.rental_analysis?.cap_rate || 0}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Cash-on-Cash Return</p>
                      <p className="font-semibold">{property.rental_analysis?.cash_on_cash_return || 0}%</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className={`text-center p-2 rounded ${property.rental_analysis?.meets_1_percent_rule ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {property.rental_analysis?.meets_1_percent_rule ? '✓ Meets 1% Rule' : '✗ Fails 1% Rule'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const PropertiesTab = () => (
    <div>
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Search Properties</h2>
        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
            <input
              type="number"
              name="min_price"
              value={filters.min_price}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="e.g., 50000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
            <input
              type="number"
              name="max_price"
              value={filters.max_price}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="e.g., 500000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              name="city"
              value={filters.city}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="e.g., Atlanta"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input
              type="text"
              name="state"
              value={filters.state}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="e.g., GA"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Bedrooms</label>
            <select
              name="min_bedrooms"
              value={filters.min_bedrooms}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
            <select
              name="property_type"
              value={filters.property_type}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Any</option>
              <option value="Single Family">Single Family</option>
              <option value="Multi Family">Multi Family</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Investment Type</label>
            <select
              name="investment_type"
              value={filters.investment_type}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Both</option>
              <option value="flip">Flip Only</option>
              <option value="rental">Rental Only</option>
            </select>
          </div>
          <div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Search Properties
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading properties...</p>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Properties ({properties.length})</h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                70% Rule: Max purchase ≤ 70% of ARV - Repairs
              </span>
              <span className="text-sm text-gray-600">
                1% Rule: Monthly rent ≥ 1% of purchase price
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
          
          {properties.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No properties found matching your criteria.</p>
              <p className="text-gray-400 mt-2">Try adjusting your filters and search again.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const EmailAlertsTab = () => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-semibold mb-6">Email Alerts</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-medium mb-4">Contact Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={userCriteria.name}
                onChange={(e) => setUserCriteria(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={userCriteria.email}
                onChange={(e) => setUserCriteria(prev => ({ ...prev, email: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="your@email.com"
              />
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-4">Alert Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={userCriteria.alert_enabled}
                  onChange={(e) => setUserCriteria(prev => ({ ...prev, alert_enabled: e.target.checked }))}
                  className="mr-2"
                />
                Enable email alerts
              </label>
            </div>
            <p className="text-sm text-gray-600">
              You will be notified when new properties matching your search criteria are found.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex space-x-4">
          <button
            onClick={handleSaveUserCriteria}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Save Alert Criteria
          </button>
          <button
            onClick={sendTestAlert}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Send Test Alert
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Note: Email alerts use your current search filters. Save your criteria first, then test.
        </p>
      </div>
    </div>
  );

  const DealCalculatorTab = () => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-semibold mb-6">Deal Calculator</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-medium mb-4">Property Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
              <input
                type="number"
                value={dealCalculator.purchase_price}
                onChange={(e) => setDealCalculator(prev => ({ ...prev, purchase_price: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="e.g., 250000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent</label>
              <input
                type="number"
                value={dealCalculator.monthly_rent}
                onChange={(e) => setDealCalculator(prev => ({ ...prev, monthly_rent: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="e.g., 2000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Expenses</label>
              <input
                type="number"
                value={dealCalculator.estimated_expenses}
                onChange={(e) => setDealCalculator(prev => ({ ...prev, estimated_expenses: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="e.g., 800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Repair Costs (optional)</label>
              <input
                type="number"
                value={dealCalculator.repair_costs}
                onChange={(e) => setDealCalculator(prev => ({ ...prev, repair_costs: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="e.g., 15000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ARV - After Repair Value (optional)</label>
              <input
                type="number"
                value={dealCalculator.arv}
                onChange={(e) => setDealCalculator(prev => ({ ...prev, arv: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="e.g., 320000"
              />
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-4">Financing</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Down Payment %</label>
              <input
                type="number"
                value={dealCalculator.down_payment_percent}
                onChange={(e) => setDealCalculator(prev => ({ ...prev, down_payment_percent: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="e.g., 20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate %</label>
              <input
                type="number"
                step="0.1"
                value={dealCalculator.interest_rate}
                onChange={(e) => setDealCalculator(prev => ({ ...prev, interest_rate: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="e.g., 7.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loan Term (years)</label>
              <input
                type="number"
                value={dealCalculator.loan_term_years}
                onChange={(e) => setDealCalculator(prev => ({ ...prev, loan_term_years: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="e.g., 30"
              />
            </div>
            <button
              onClick={handleDealCalculation}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Calculate Deal
            </button>
          </div>
        </div>
      </div>
      
      {calculatorResult && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium mb-4">Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Financing</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Down Payment:</strong> {formatCurrency(calculatorResult.down_payment)}</p>
                <p><strong>Loan Amount:</strong> {formatCurrency(calculatorResult.loan_amount)}</p>
                <p><strong>Monthly Payment:</strong> {formatCurrency(calculatorResult.monthly_payment)}</p>
                <p><strong>Total Cash Invested:</strong> {formatCurrency(calculatorResult.total_cash_invested)}</p>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">Cash Flow</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Monthly Cash Flow:</strong> {formatCurrency(calculatorResult.monthly_cash_flow)}</p>
                <p><strong>Annual Cash Flow:</strong> {formatCurrency(calculatorResult.annual_cash_flow)}</p>
                <p><strong>Cap Rate:</strong> {calculatorResult.cap_rate}%</p>
                <p><strong>Cash-on-Cash Return:</strong> {calculatorResult.cash_on_cash_return}%</p>
              </div>
            </div>
            
            {calculatorResult.flip_analysis && (
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2">Flip Analysis</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>ARV:</strong> {formatCurrency(calculatorResult.flip_analysis.arv)}</p>
                  <p><strong>Max Purchase (70%):</strong> {formatCurrency(calculatorResult.flip_analysis.max_purchase_70_rule)}</p>
                  <p><strong>Meets 70% Rule:</strong> {calculatorResult.flip_analysis.meets_70_rule ? '✓ Yes' : '✗ No'}</p>
                  <p><strong>Potential Profit:</strong> {formatCurrency(calculatorResult.flip_analysis.potential_profit)}</p>
                  <p><strong>Flip ROI:</strong> {calculatorResult.flip_analysis.flip_roi}%</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const MarketAnalysisTab = () => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-semibold mb-6">Market Analysis</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {markets.map((market, index) => (
          <div key={index} className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">{market.city}, {market.state}</h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Market Type</p>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getMarketTypeColor(market.market_trends.market_type)}`}>
                  {market.market_trends.market_type}
                </span>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Average Price</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(market.avg_price)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Average Rent</p>
                <p className="text-lg font-semibold text-green-600">{formatCurrency(market.avg_rent)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Rent Yield</p>
                <p className="text-lg font-semibold">{market.avg_rent_yield.toFixed(1)}%</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Appreciation Rate</p>
                <p className="text-lg font-semibold text-green-600">{market.market_trends.appreciation_rate}%</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Price Trend</p>
                <p className="text-sm">{market.market_trends.price_trend}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Rental Demand</p>
                <p className="text-sm">{market.market_trends.rental_demand}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Avg Days on Market</p>
                <p className="text-sm">{market.market_trends.days_on_market_avg} days</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Properties Available</p>
                <p className="text-sm">{market.total_properties}</p>
              </div>

              {market.property_type_breakdown && (
                <div>
                  <p className="text-sm text-gray-600">Property Mix</p>
                  <div className="text-sm">
                    <p>Single Family: {market.property_type_breakdown.single_family_percent.toFixed(0)}%</p>
                    <p>Multi Family: {market.property_type_breakdown.multi_family_percent.toFixed(0)}%</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {markets.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No market data available.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Real Estate Investment Sourcing</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Finding properties for flips & rentals</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('properties')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'properties'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Properties
            </button>
            <button
              onClick={() => setActiveTab('calculator')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'calculator'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Deal Calculator
            </button>
            <button
              onClick={() => setActiveTab('market')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'market'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Market Analysis
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'alerts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Email Alerts
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'properties' && <PropertiesTab />}
        {activeTab === 'calculator' && <DealCalculatorTab />}
        {activeTab === 'market' && <MarketAnalysisTab />}
        {activeTab === 'alerts' && <EmailAlertsTab />}
      </div>

      {/* Property Modal */}
      {selectedProperty && (
        <PropertyModal 
          property={selectedProperty} 
          onClose={() => setSelectedProperty(null)} 
        />
      )}
    </div>
  );
}

export default App;