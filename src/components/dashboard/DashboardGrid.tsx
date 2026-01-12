import React, { memo, useCallback } from 'react';
import { View, FlatList, RefreshControl, Dimensions, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing } from '../../lib/theme';
import { Alter } from '../../types';
import { AlterBubble } from './AlterBubble';
import { DashboardHeader } from './DashboardHeader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTAINER_PADDING = 16;
const AVAILABLE_WIDTH = SCREEN_WIDTH - (CONTAINER_PADDING * 2);

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
    deleteMode = false
}: DashboardGridProps) => {

    const renderItem = useCallback(({ item }: { item: GridItem }) => (
        <View style={{ width: AVAILABLE_WIDTH / numColumns, alignItems: 'center' }}>
            <AlterBubble
                alter={item.type === 'alter' ? item.data : undefined}
                type={item.type}
                size={bubbleSize}
                selectionMode={selectionMode}
                isSelected={item.type === 'alter' && selectedAlters.includes(item.data.id)}
                dimmed={selectionMode === 'multi' && selectedAlters.length > 0 && (item.type !== 'alter' || !selectedAlters.includes(item.data.id))}
                deleteMode={deleteMode}
                onPress={() => {
                    if (item.type === 'alter') toggleSelection(item.data.id);
                    else if (item.type === 'blurry') handleBlurryMode();
                    else if (item.type === 'add') setModalVisible(true);
                }}
                onLongPress={() => item.type === 'alter' && router.push(`/alter-space/${item.data.id}` as any)}
            />
        </View>
    ), [numColumns, bubbleSize, selectionMode, selectedAlters, deleteMode, toggleSelection, handleBlurryMode, setModalVisible]);

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
