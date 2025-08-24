import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import DropDownPicker from "react-native-dropdown-picker";
import Toast from "react-native-toast-message";
import { useTheme } from "../theme/ThemeContext";
import { apiClient } from "../services/ApiClient";
import Ionicons from "react-native-vector-icons/Ionicons";
import Header from "../components/Header";

interface ManageOperationsScreenProps {
  navigation: DrawerNavigationProp<any>;
}

interface EntityItem {
  id: number;
  label: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

interface EntityType {
  value: string;
  label: string;
  icon: string;
}

const entityTypes: EntityType[] = [
  { value: "vessel", label: "Vessels", icon: "boat" },
  { value: "type", label: "Types", icon: "list" },
  { value: "movement", label: "Movements", icon: "shuffle" },
  { value: "berth", label: "Berths", icon: "location" },
  { value: "agent", label: "Agents", icon: "person" },
  { value: "order_status", label: "Status", icon: "flag" },
];

const ManageOperationsScreen: React.FC<ManageOperationsScreenProps> = ({
  navigation,
}) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Entity selection
  const [selectedEntityType, setSelectedEntityType] = useState("vessel");
  const [entityTypeOpen, setEntityTypeOpen] = useState(false);
  const [entities, setEntities] = useState<EntityItem[]>([]);

  // Add/Edit modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<EntityItem | null>(null);
  const [formLabel, setFormLabel] = useState("");

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchEntities();
  }, [selectedEntityType]);

  const fetchEntities = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getEntityItems(selectedEntityType);

      if (response.success && response.data) {
        const entityData = Array.isArray(response.data[selectedEntityType])
          ? response.data[selectedEntityType]
          : [];
        setEntities(entityData);
      } else {
        setEntities([]);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: response.message || "Failed to load entities",
        });
      }
    } catch (error: any) {
      console.error("Error fetching entities:", error);
      setEntities([]);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load entities",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEntities();
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormLabel("");
    setModalVisible(true);
  };

  const handleEdit = (item: EntityItem) => {
    setEditingItem(item);
    setFormLabel(item.label);
    setModalVisible(true);
  };

  const handleDelete = (item: EntityItem) => {
    Alert.alert(
      "Delete Item",
      `Are you sure you want to delete "${item.label}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => performDelete(item.id),
        },
      ]
    );
  };

  const performDelete = async (id: number) => {
    try {
      const response = await apiClient.deleteEntityItem(selectedEntityType, id);

      if (response.success) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Item deleted successfully",
        });
        fetchEntities();
      } else {
        throw new Error(response.message || "Failed to delete item");
      }
    } catch (error: any) {
      console.error("Error deleting item:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to delete item",
      });
    }
  };

  const handleSubmit = async () => {
    if (!formLabel.trim()) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Label is required",
      });
      return;
    }

    setSubmitting(true);

    try {
      const data = {
        label: formLabel.trim(),
        value: formLabel.trim(),
      };

      let response;
      if (editingItem) {
        response = await apiClient.updateEntityItem(
          selectedEntityType,
          editingItem.id,
          data
        );
      } else {
        response = await apiClient.createEntityItem(selectedEntityType, data);
      }

      if (response.success) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: editingItem
            ? "Item updated successfully"
            : "Item created successfully",
        });
        setModalVisible(false);
        setFormLabel("");
        setEditingItem(null);
        fetchEntities();
      } else {
        throw new Error(response.message || "Failed to save item");
      }
    } catch (error: any) {
      console.error("Error saving item:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to save item",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEntities = entities.filter((entity) =>
    entity.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderEntityItem = ({ item }: { item: EntityItem }) => (
    <View
      style={[
        styles.beautifulEntityCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.entityIconContainer}>
        <Ionicons
          name={selectedEntity?.icon as any}
          size={24}
          color={theme.colors.primary}
          style={styles.entityIcon}
        />
      </View>
      <View style={styles.entityInfo}>
        <Text style={[styles.entityLabel, { color: theme.colors.text }]}>
          {item.label}
        </Text>
        <Text style={[styles.entityId, { color: theme.colors.placeholder }]}>
          ID: {item.id}
        </Text>
      </View>
      <View style={styles.entityActions}>
        <TouchableOpacity
          style={[
            styles.beautifulActionButton,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => handleEdit(item)}
        >
          <Ionicons name="pencil" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.beautifulActionButton, styles.deleteButton]}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const selectedEntity = entityTypes.find(
    (e) => e.value === selectedEntityType
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
       <SafeAreaView style={[styles.headerSafeArea, { backgroundColor: theme.colors.primary }]}>
             <View style={styles.header}>
               <TouchableOpacity
                 style={styles.backButton}
                 onPress={() => navigation.goBack()}>
                 <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
               </TouchableOpacity>
               <Text style={styles.headerTitle}>Manage Operations</Text>
               <TouchableOpacity
                style={styles.addButton}
                 onPress={handleAdd}>
                  <Ionicons name="add" size={28} color="#FFFFFF" />
               </TouchableOpacity>
             </View>
           </SafeAreaView>
      {/* Entity Type Selector */}
      <View style={styles.selectorContainer}>
        <Text style={[styles.selectorLabel, { color: theme.colors.text }]}>
          Select Entity Type
        </Text>
        <DropDownPicker
          open={entityTypeOpen}
          value={selectedEntityType}
          items={entityTypes.map((type) => ({
            label: type.label,
            value: type.value,
            icon: () => (
              <Ionicons
                name={type.icon as any}
                size={18}
                color={theme.colors.primary}
              />
            ),
          }))}
          setOpen={setEntityTypeOpen}
          setValue={setSelectedEntityType}
          placeholder="Choose an entity type..."
          placeholderStyle={{
            color: theme.colors.placeholder,
            fontStyle: "italic",
          }}
          textStyle={{
            fontSize: 16,
            fontWeight: "500",
            color: theme.colors.text,
          }}
          labelStyle={{
            fontWeight: "600",
            color: theme.colors.text,
          }}
          listMode="SCROLLVIEW"
          scrollViewProps={{
            decelerationRate: "fast",
          }}
          itemSeparator={true}
          itemSeparatorStyle={{
            backgroundColor: theme.colors.border,
            height: 1,
            marginHorizontal: 10,
          }}
          style={[
            styles.beautifulDropdown,
            {
              borderColor: "transparent",
              backgroundColor: theme.colors.card,
              shadowColor: theme.colors.text,
            },
          ]}
          dropDownContainerStyle={[
            styles.beautifulDropdownContainer,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.card,
              shadowColor: theme.colors.text,
            },
          ]}
          arrowIconStyle={{
            width: 20,
            height: 20,
          }}
          tickIconStyle={{
            width: 20,
            height: 20,
          }}
        />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchInputContainer,
            { borderColor: theme.colors.border },
          ]}
        >
          <Ionicons name="search" size={20} color={theme.colors.placeholder} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder={`Search ${selectedEntity?.label.toLowerCase()}...`}
            placeholderTextColor={theme.colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close"
                size={20}
                color={theme.colors.placeholder}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Entity List */}
      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={[styles.listTitle, { color: theme.colors.text }]}>
            {selectedEntity?.label} ({filteredEntities.length})
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.text }]}>
              Loading {selectedEntity?.label.toLowerCase()}...
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredEntities}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderEntityItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name={selectedEntity?.icon as any}
                  size={64}
                  color={theme.colors.placeholder}
                />
                <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                  No {selectedEntity?.label.toLowerCase()} found
                </Text>
                <Text
                  style={[
                    styles.emptySubtitle,
                    { color: theme.colors.placeholder },
                  ]}
                >
                  {searchQuery
                    ? "Try adjusting your search criteria"
                    : `Add your first ${selectedEntity?.label.toLowerCase()} to get started`}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.card },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {editingItem ? "Edit" : "Add"}{" "}
                {selectedEntity?.label.slice(0, -1)}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <Text
                style={[styles.modalLabel, { color: theme.colors.text }]}
              >{`${selectedEntity?.label.slice(0, -1)} *`}</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                placeholder={`Enter ${selectedEntity?.label.slice(0, -1)}`}
                placeholderTextColor={theme.colors.placeholder}
                value={formLabel}
                onChangeText={setFormLabel}
                autoFocus
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingItem ? "Update" : "Create"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSafeArea: {
      backgroundColor: "#45BBA5",
      height: Dimensions.get("window").height * (Platform.OS === 'ios' ? 0.15 : 0.12),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      paddingTop: Platform.OS === "ios" ? 5 : 15,
    },
    backButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      flex: 1,
      fontSize: 20,
      fontWeight: 'bold',
      color: '#FFFFFF',
      textAlign: 'center',
      marginHorizontal: 10,
    },
    editButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    editButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
  menuButton: {
    marginRight: 15,
  },
 
  addButton: {
    padding: 5,
  },
  selectorContainer: {
    padding: 20,
    paddingBottom: 15,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  selectorLabel: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  dropdownContainer: {
    borderWidth: 1,
    backgroundColor: "#FFFFFF",
  },
  beautifulDropdown: {
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 50,
  },
  beautifulDropdownContainer: {
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    marginTop: 2,
    maxHeight: 300,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: "#FFFFFF",
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  listContainer: {
    flex: 1,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  entityCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  beautifulEntityCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 12,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  entityIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  entityIcon: {
    // Empty style for icon spacing
  },
  entityInfo: {
    flex: 1,
  },
  entityLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  entityId: {
    fontSize: 12,
  },
  entityActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  beautifulActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  deleteButton: {
    backgroundColor: "#EF4444",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 5,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalCloseButton: {
    padding: 5,
  },
  modalForm: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#6B7280",
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});

export default ManageOperationsScreen;
