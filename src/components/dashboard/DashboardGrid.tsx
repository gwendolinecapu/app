import React, { memo, useCallback } from 'react';
import { View, FlatList, RefreshControl, StyleSheet, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../lib/theme';
import { Alter } from '../../types';
import { AlterBubble } from './AlterBubble';

const CONTAINER_PADDING = 16;

export type GridItem =
    | { type: 'blurry' }
    | { type: 'add' }
    | { type: 'alter'; data: Alter };

interface DashboardGridProps {
    data: GridItem[];
    numColumns: number;
    bubbleSize: number;
    selectionMode: 'single' | 'multi';
    selectedAlters: string[];
    refreshing: boolean;
    onRefresh: () => void;
    toggleSelection: (id: string) => void;
    handleBlurryMode: () => void;
    setModalVisible: (visible: boolean) => void;
    ListHeaderComponent?: React.ReactElement;
    deleteMode?: boolean;
    onAlterLongPress?: (alter: Alter) => void;
}

// Optimization: Wrapper to prevent unnecessary re-renders of items when selection changes
interface GridItemWrapperProps {
    item: GridItem;
    width: number;
    selectedAlters: string[];
    selectionMode: 'single' | 'multi';
    bubbleSize: number;
    deleteMode: boolean;
    toggleSelection: (id: string) => void;
    handleBlurryMode: () => void;
    setModalVisible: (visible: boolean) => void;
    onAlterLongPress?: (alter: Alter) => void;
}

const GridItemWrapper = memo(({
    item,
    width,
    selectedAlters,
    selectionMode,
    bubbleSize,
    deleteMode,
    toggleSelection,
    handleBlurryMode,
    setModalVisible,
    onAlterLongPress
}: GridItemWrapperProps) => {

    // Calculate derived state for this specific item
    const isSelected = item.type === 'alter' && selectedAlters.includes(item.data.id);
    const dimmed = selectionMode === 'multi' && selectedAlters.length > 0 &&
                  (item.type !== 'alter' || !selectedAlters.includes(item.data.id));

    const onPress = () => {
        if (item.type === 'alter') toggleSelection(item.data.id);
        else if (item.type === 'blurry') handleBlurryMode();
        else if (item.type === 'add') setModalVisible(true);
    };

    const onLongPress = () => {
        if (item.type === 'alter') {
            if (onAlterLongPress) {
                onAlterLongPress(item.data);
            } else {
                router.push(`/alter-space/${item.data.id}` as any);
            }
        }
    };

    return (
        <View style={{ width, alignItems: 'center' }}>
            <AlterBubble
                alter={item.type === 'alter' ? item.data : undefined}
                type={item.type}
                size={bubbleSize}
                selectionMode={selectionMode}
                isSelected={isSelected}
                dimmed={dimmed}
                deleteMode={deleteMode}
                onPress={onPress}
                onLongPress={onLongPress}
            />
        </View>
    );
}, (prev, next) => {
    // Custom comparison for performance
    if (prev.width !== next.width) return false;
    if (prev.bubbleSize !== next.bubbleSize) return false;
    if (prev.selectionMode !== next.selectionMode) return false;
    if (prev.deleteMode !== next.deleteMode) return false;

    // Check if item data changed (reference check usually sufficient)
    if (prev.item !== next.item) return false;

    // Check if selection state changed for THIS item
    // We don't care if selectedAlters array changed, only if it affects us

    const prevIsSelected = prev.item.type === 'alter' && prev.selectedAlters.includes(prev.item.data.id);
    const nextIsSelected = next.item.type === 'alter' && next.selectedAlters.includes(next.item.data.id);
    if (prevIsSelected !== nextIsSelected) return false;

    const prevDimmed = prev.selectionMode === 'multi' && prev.selectedAlters.length > 0 &&
                      (prev.item.type !== 'alter' || !prev.selectedAlters.includes(prev.item.data.id));
    const nextDimmed = next.selectionMode === 'multi' && next.selectedAlters.length > 0 &&
                      (next.item.type !== 'alter' || !next.selectedAlters.includes(next.item.data.id));
    if (prevDimmed !== nextDimmed) return false;

    // Callbacks are assumed stable enough or we accept re-render if they change (rare)
    return true;
});

GridItemWrapper.displayName = 'GridItemWrapper';

const DashboardGridComponent = ({
    data,
    numColumns,
    bubbleSize,
    selectionMode,
    selectedAlters,
    refreshing,
    onRefresh,
    toggleSelection,
    handleBlurryMode,
    setModalVisible,
    ListHeaderComponent,
    deleteMode = false,
    onAlterLongPress,
}: DashboardGridProps) => {
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const AVAILABLE_WIDTH = SCREEN_WIDTH - (CONTAINER_PADDING * 2);
    const itemWidth = AVAILABLE_WIDTH / numColumns;

    const renderItem = useCallback(({ item }: { item: GridItem }) => (
        <GridItemWrapper
            item={item}
            width={itemWidth}
            selectedAlters={selectedAlters}
            selectionMode={selectionMode}
            bubbleSize={bubbleSize}
            deleteMode={deleteMode}
            toggleSelection={toggleSelection}
            handleBlurryMode={handleBlurryMode}
            setModalVisible={setModalVisible}
            onAlterLongPress={onAlterLongPress}
        />
    ), [itemWidth, selectedAlters, selectionMode, bubbleSize, deleteMode, toggleSelection, handleBlurryMode, setModalVisible, onAlterLongPress]);

    const keyExtractor = useCallback((item: GridItem) => item.type === 'alter' ? item.data.id : item.type, []);

    return (
        <FlatList
            key={`grid-${numColumns}`}
            data={data}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            numColumns={numColumns}
            contentContainerStyle={[styles.gridContent, { paddingBottom: 120, paddingHorizontal: CONTAINER_PADDING }]}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={ListHeaderComponent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            removeClippedSubviews={true}
            initialNumToRender={12}
            maxToRenderPerBatch={12}
            windowSize={5}
            extraData={selectedAlters}
        />
    );
};

const styles = StyleSheet.create({
    gridContent: {
        paddingBottom: 40,
    },
});

export const DashboardGrid = memo(DashboardGridComponent);
DashboardGrid.displayName = 'DashboardGrid';
