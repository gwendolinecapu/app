import React, { memo, useCallback } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Alter, GridItem } from '../../types';
import { AlterBubble } from './AlterBubble';

interface DashboardGridItemProps {
    item: GridItem;
    isSelected: boolean;
    dimmed: boolean;
    selectionMode: 'single' | 'multi';
    deleteMode: boolean;
    bubbleSize: number;
    itemWidth: number;
    toggleSelection: (id: string) => void;
    handleBlurryMode: () => void;
    setModalVisible: (visible: boolean) => void;
    onAlterLongPress?: (alter: Alter) => void;
}

const DashboardGridItemComponent = ({
    item,
    isSelected,
    dimmed,
    selectionMode,
    deleteMode,
    bubbleSize,
    itemWidth,
    toggleSelection,
    handleBlurryMode,
    setModalVisible,
    onAlterLongPress,
}: DashboardGridItemProps) => {

    const handlePress = useCallback(() => {
        if (item.type === 'alter') toggleSelection(item.data.id);
        else if (item.type === 'blurry') handleBlurryMode();
        else if (item.type === 'add') setModalVisible(true);
    }, [item, toggleSelection, handleBlurryMode, setModalVisible]);

    const handleLongPress = useCallback(() => {
        if (item.type === 'alter') {
            if (onAlterLongPress) {
                onAlterLongPress(item.data);
            } else {
                router.push(`/alter-space/${item.data.id}` as any);
            }
        }
    }, [item, onAlterLongPress]);

    return (
        <View style={{ width: itemWidth, alignItems: 'center' }}>
            <AlterBubble
                alter={item.type === 'alter' ? item.data : undefined}
                type={item.type}
                size={bubbleSize}
                selectionMode={selectionMode}
                isSelected={isSelected}
                dimmed={dimmed}
                deleteMode={deleteMode}
                onPress={handlePress}
                onLongPress={handleLongPress}
            />
        </View>
    );
};

export const DashboardGridItem = memo(DashboardGridItemComponent, (prev, next) => {
    return (
        prev.isSelected === next.isSelected &&
        prev.dimmed === next.dimmed &&
        prev.item === next.item &&
        prev.selectionMode === next.selectionMode &&
        prev.deleteMode === next.deleteMode &&
        prev.bubbleSize === next.bubbleSize &&
        prev.itemWidth === next.itemWidth &&
        prev.toggleSelection === next.toggleSelection &&
        prev.handleBlurryMode === next.handleBlurryMode &&
        prev.setModalVisible === next.setModalVisible &&
        prev.onAlterLongPress === next.onAlterLongPress
    );
});
