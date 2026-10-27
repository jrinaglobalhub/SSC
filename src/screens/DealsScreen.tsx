import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl
} from "react-native";
import { Search, Tag, X, Flame } from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { DealCard } from "../components/DealCard";
import { Header } from "../components/Header";

type SortMode = "distance" | "discount" | "expiry";

export const DealsScreen: React.FC = () => {
  const { offers, isLoading, refreshData } = useApp();
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("distance");

  const filteredDeals = useMemo(() => {
    let result = [...offers];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.storeName.toLowerCase().includes(q) ||
          o.description.toLowerCase().includes(q) ||
          o.category.toLowerCase().includes(q) ||
          o.discountTag.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortMode === "distance") {
      result.sort((a, b) => (a.distanceInMeters || 0) - (b.distanceInMeters || 0));
    } else if (sortMode === "discount") {
      result.sort((a, b) => (b.offerPercentage || 0) - (a.offerPercentage || 0));
    } else if (sortMode === "expiry") {
      result.sort((a, b) => (a.expiresInMinutes || 999) - (b.expiresInMinutes || 999));
    }

    return result;
  }, [offers, search, sortMode]);

  return (
    <View style={styles.container}>
      <Header />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search deals, products, stores..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")} style={{ padding: 4 }}>
              <X size={14} color="#64748B" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Sort Pills in Brand Orange */}
      <View style={styles.sortRow}>
        <TouchableOpacity
          style={[styles.sortPill, sortMode === "distance" && styles.sortPillActive]}
          onPress={() => setSortMode("distance")}
          activeOpacity={0.8}
        >
          <Text style={[styles.sortText, sortMode === "distance" && styles.sortTextActive]}>
            Nearest First
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sortPill, sortMode === "discount" && styles.sortPillActive]}
          onPress={() => setSortMode("discount")}
          activeOpacity={0.8}
        >
          <Text style={[styles.sortText, sortMode === "discount" && styles.sortTextActive]}>
            Highest Discount
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sortPill, sortMode === "expiry" && styles.sortPillActive]}
          onPress={() => setSortMode("expiry")}
          activeOpacity={0.8}
        >
          <Text style={[styles.sortText, sortMode === "expiry" && styles.sortTextActive]}>
            Expiring Soon
          </Text>
        </TouchableOpacity>
      </View>

      {/* Deals Header Badge */}
      <View style={styles.dealsCountRow}>
        <View style={styles.countTitleGroup}>
          <Flame size={15} color="#EA580C" />
          <Text style={styles.countTitle}>All Live Offers</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{filteredDeals.length} Deals</Text>
        </View>
      </View>

      {/* Deals List */}
      <FlatList
        data={filteredDeals}
        key="deals_grid_2"
        numColumns={2}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshData} colors={["#EA580C"]} />
        }
        renderItem={({ item }) => <DealCard offer={item} />}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Tag size={28} color="#EA580C" />
            </View>
            <Text style={styles.emptyTitle}>No matching deals found</Text>
            <Text style={styles.emptySubtitle}>
              Try searching with another keyword or expanding your radar radius.
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 90, paddingTop: 4 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },
  searchContainer: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF"
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 24,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
    color: "#0F172A"
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  sortPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  sortPillActive: {
    backgroundColor: "#EA580C",
    borderColor: "#EA580C"
  },
  sortText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569"
  },
  sortTextActive: {
    color: "#FFFFFF",
    fontWeight: "800"
  },
  dealsCountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  countTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  countTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0F172A"
  },
  countBadge: {
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#EA580C"
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    marginTop: 20
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A"
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 20
  },
  columnWrapper: {
    paddingHorizontal: 10
  }
});
