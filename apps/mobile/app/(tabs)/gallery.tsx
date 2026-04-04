/**
 * Gallery Screen — displays all uploaded images in a grid.
 *
 * How it works:
 * 1. On mount, useImages() fetches the image list from the API
 * 2. Images are shown in a 2-column grid using FlatList
 * 3. A search bar at the top switches to useSearch() results
 * 4. Tapping an image navigates to the photo detail screen
 *
 * Key React Native concepts:
 * - FlatList: efficient scrollable list that only renders visible items
 *   (unlike ScrollView which renders everything). Essential for long lists.
 * - numColumns={2}: makes FlatList render items in a grid
 * - TextInput: the text field component (equivalent to <input> on web)
 */
import { useState } from "react";
import {
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";

import { Text, View } from "@/components/Themed";
import { useImages, useSearch } from "@/hooks/useApi";
import { API_URL } from "@/constants/api";
import type { ImageItem } from "@/types";

export default function GalleryScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const { data: imageData, loading: imagesLoading, refresh } = useImages();
  const { data: searchData, loading: searchLoading, execute: search } = useSearch();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      search(searchQuery);
    } else {
      setIsSearching(false);
      refresh();
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    refresh();
  };

  // Show search results or regular image list
  const items = isSearching
    ? searchData?.items || []
    : imageData?.items || [];
  const loading = isSearching ? searchLoading : imagesLoading;

  /**
   * renderItem — called by FlatList for each item in the array.
   *
   * FlatList is like a for-loop that renders UI:
   * - `item` is the current ImageItem from the array
   * - Returns the JSX to render for that item
   * - FlatList handles scrolling, recycling off-screen items, and performance
   */
  const renderItem = ({ item }: { item: ImageItem }) => {
    // Build image URL: use the API to get a presigned MinIO URL
    // For the grid thumbnail, we use the storage path directly
    return (
      <TouchableOpacity
        style={styles.imageCard}
        onPress={() => router.push(`/photo/${item.id}` as any)}
      >
        {item.storagePath ? (
          <Image
            source={{ uri: `${API_URL}/images/${item.id}/file` }}
            style={styles.thumbnail}
          />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Text>No image</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search photos..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {isSearching && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Results count */}
      {isSearching && searchData && (
        <Text style={styles.resultCount}>
          {searchData.total} result{searchData.total !== 1 ? "s" : ""} for
          {" \u201C"}{searchData.query}{"\u201D"}
        </Text>
      )}

      {/* Loading spinner */}
      {loading && (
        <ActivityIndicator
          size="large"
          color="#2196F3"
          style={styles.loader}
        />
      )}

      {/* Image grid */}
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>
              {isSearching ? "No photos found" : "No photos uploaded yet"}
            </Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxWidth: 800,
    alignSelf: "center",
    width: "100%",
  },
  searchContainer: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  clearButton: {
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  clearButtonText: {
    color: "#2196F3",
    fontSize: 15,
  },
  resultCount: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    color: "#666",
    fontSize: 14,
  },
  loader: {
    marginTop: 20,
  },
  grid: {
    padding: 2,
  },
  row: {
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  imageCard: {
    width: "31%",
    marginBottom: 4,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#f5f5f5",
  },
  thumbnail: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#e0e0e0",
    resizeMode: "cover",
  },
  thumbnailPlaceholder: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  imageName: {
    fontSize: 13,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingTop: 6,
  },
  imageTags: {
    fontSize: 11,
    color: "#888",
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#999",
    fontSize: 16,
  },
});
