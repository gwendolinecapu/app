import React, { memo, useCallback } from 'react';
import { FlatList, RefreshControl, Dimensions, StyleSheet } from 'react-native';
import { colors } from '../../lib/theme';
import { Alter, GridItem } from '../../types';
import { DashboardGridItem } from './DashboardGridItem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTAINER_PADDING = 16;
const AVAILABLE_WIDTH = SCREEN_WIDTH - (CONTAINER_PADDING * 2);

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

    const renderItem = useCallback(({ item }: { item: GridItem }) => {
        const isSelected = item.type === 'alter' && selectedAlters.includes(item.data.id);
        const dimmed = selectionMode === 'multi' && selectedAlters.length > 0 && (item.type !== 'alter' || !selectedAlters.includes(item.data.id));

        return (
            <DashboardGridItem
                item={item}
                isSelected={isSelected}
                dimmed={dimmed}
                selectionMode={selectionMode}
                deleteMode={deleteMode}
                bubbleSize={bubbleSize}
                itemWidth={AVAILABLE_WIDTH / numColumns}
                toggleSelection={toggleSelection}
                handleBlurryMode={handleBlurryMode}
                setModalVisible={setModalVisible}
                onAlterLongPress={onAlterLongPress}
            />
        );
    }, [selectionMode, selectedAlters, deleteMode, bubbleSize, numColumns, toggleSelection, handleBlurryMode, setModalVisible, onAlterLongPress]);

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
        />
    );
};

const styles = StyleSheet.create({
    gridContent: {
        paddingBottom: 40,
    },
});

export const DashboardGrid = memo(DashboardGridComponent);
