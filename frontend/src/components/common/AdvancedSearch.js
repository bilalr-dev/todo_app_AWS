// Advanced search component for v0.6
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Tag, 
  Flag, 
  File, 
  X, 
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const AdvancedSearch = ({ 
  onSearch, 
  onFilterChange, 
  filterOptions = {}, 
  className = '',
  clearTrigger = 0
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    priorities: [],
    categories: [],
    status: 'all',
    startDate: '',
    endDate: '',
    dueStartDate: '',
    dueEndDate: '',
    hasFiles: 'all',
    sortBy: 'created_at',
    sortDirection: 'DESC'
  });

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filters);
    }
  }, [filters, onFilterChange]);

  useEffect(() => {
    if (clearTrigger > 0) {
      clearFilters();
    }
  }, [clearTrigger]);

  const handleSearchChange = async (value) => {
    setFilters(prev => ({ ...prev, search: value }));
    
    if (value.length >= 2) {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
        const response = await fetch(`${apiUrl}/advanced/suggestions?q=${encodeURIComponent(value)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
          setShowSuggestions(true);
        }
      } catch (error) {
        // Silently fail if suggestions can't be fetched
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setFilters(prev => ({ ...prev, search: suggestion.value }));
    setShowSuggestions(false);
  };

  const handlePriorityChange = (priority) => {
    setFilters(prev => ({
      ...prev,
      priorities: prev.priorities.includes(priority)
        ? prev.priorities.filter(p => p !== priority)
        : [...prev.priorities, priority]
    }));
  };

  const handleCategoryChange = (category) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };


  const handleSortChange = (field) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortDirection: prev.sortBy === field && prev.sortDirection === 'ASC' ? 'DESC' : 'ASC'
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      priorities: [],
      categories: [],
      status: 'all',
      startDate: '',
      endDate: '',
      dueStartDate: '',
      dueEndDate: '',
      hasFiles: 'all',
      sortBy: 'created_at',
      sortDirection: 'DESC'
    });
  };

  const hasActiveFilters = () => {
    return filters.search || 
           filters.priorities.length > 0 || 
           filters.categories.length > 0 || 
           filters.status !== 'all' ||
           filters.startDate || 
           filters.endDate || 
           filters.dueStartDate || 
           filters.dueEndDate || 
           filters.hasFiles !== 'all';
  };

  const getSortIcon = (field) => {
    if (filters.sortBy !== field) return null;
    return filters.sortDirection === 'ASC' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  return (
    <div className={`advanced-search ${className}`}>
      {/* Main Search Bar */}
      <div className="relative">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
          <input
            type="text"
            placeholder="Search to dos, categories, descriptions..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setShowSuggestions(filters.search.length >= 2)}
            className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg"
          />
          {filters.search && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors duration-200 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-visible animate-in slide-in-from-top-2 duration-200">
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1 mb-1">
                Suggestions
              </div>
              <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent pb-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-150 group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 group-hover:bg-blue-600 transition-colors duration-150"></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                          {suggestion.type}
                        </div>
                        <div className="text-sm text-gray-900 dark:text-gray-100 truncate">
                          {suggestion.label}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Filters - Always Visible */}
      <div className="mt-4 flex flex-wrap gap-2">
        {/* Priority Quick Filters */}
        {filterOptions.priorities?.map(priority => (
          <button
            key={priority}
            onClick={() => handlePriorityChange(priority)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              filters.priorities.includes(priority)
                ? 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
            }`}
          >
            <Flag className="w-3 h-3 inline mr-1" />
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </button>
        ))}

        {/* Status Quick Filters */}
        <button
          onClick={() => setFilters(prev => ({ ...prev, status: prev.status === 'pending' ? 'all' : 'pending' }))}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
            filters.status === 'pending'
              ? 'bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700'
              : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
          }`}
        >
          <div className="w-3 h-3 inline mr-1 rounded-full bg-orange-500"></div>
          In Progress
        </button>

        <button
          onClick={() => setFilters(prev => ({ ...prev, status: prev.status === 'completed' ? 'all' : 'completed' }))}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
            filters.status === 'completed'
              ? 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700'
              : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
          }`}
        >
          <div className="w-3 h-3 inline mr-1 rounded-full bg-green-500"></div>
          Completed
        </button>

        {/* File Filter */}
        <button
          onClick={() => setFilters(prev => ({ ...prev, hasFiles: prev.hasFiles === 'true' ? 'all' : 'true' }))}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
            filters.hasFiles === 'true'
              ? 'bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700'
              : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
          }`}
        >
          <File className="w-3 h-3 inline mr-1" />
          With Files
        </button>
      </div>

      {/* Advanced Options Toggle */}
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 group"
        >
          <Filter className="w-4 h-4" />
          <span>More Options</span>
          <div className="ml-1 transition-transform duration-200">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {hasActiveFilters() && (
          <button
            onClick={clearFilters}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
          >
            <X className="w-3 h-3" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Advanced Options - Collapsible */}
      {isExpanded && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 animate-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Categories
              </label>
              <div className="flex flex-wrap gap-2">
                {filterOptions.categories?.map(category => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                      filters.categories.includes(category)
                        ? 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700'
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort By
              </label>
              <div className="flex flex-wrap gap-2">
                {filterOptions.sortOptions?.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                      filters.sortBy === option.value
                        ? 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
                    }`}
                  >
                    {option.label}
                    {getSortIcon(option.value)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;