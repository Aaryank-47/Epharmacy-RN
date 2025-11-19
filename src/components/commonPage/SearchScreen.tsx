import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Filter search results
export const filterSearchResults = (items: any[], query: string): any[] => {
  const lowerQuery = query.toLowerCase();
  return items.filter(item => 
    item.name?.toLowerCase().includes(lowerQuery) || 
    item.description?.toLowerCase().includes(lowerQuery)
  );
};

// Sort search results by relevance
export const sortByRelevance = (items: any[], query: string): any[] => {
  return [...items].sort((a, b) => {
    const aScore = a.name.toLowerCase().indexOf(query.toLowerCase());
    const bScore = b.name.toLowerCase().indexOf(query.toLowerCase());
    return aScore - bScore;
  });
};

// Get search suggestions
export const getSearchSuggestions = (history: string[], query: string): string[] => {
  return history.filter(item => item.toLowerCase().startsWith(query.toLowerCase())).slice(0, 5);
};

// Highlight search term
export const highlightSearchTerm = (text: string, term: string): string => {
  const regex = new RegExp(`(${term})`, 'gi');
  return text.replace(regex, '**$1**');
};

const SearchScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default SearchScreen;
