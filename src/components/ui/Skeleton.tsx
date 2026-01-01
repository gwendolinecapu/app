
import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';

interface SkeletonProps {
  shape: 'circle' | 'rect' | 'text';
  width?: number | string;
  height?: number | string;
  style?: object;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  shape,
  width,
  height,
  style,
}) => {
  const theme = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true);
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      [0, 0.5, 1],
      [0.1, 0.3, 0.1],
      Extrapolation.CLAMP
    );
    return {
      opacity,
    };
  });

  const getShapeStyle = () => {
    switch (shape) {
      case 'circle':
        return {
          width: width || 50,
          height: height || 50,
          borderRadius: (typeof width === 'number' ? width : 50) / 2,
        };
      case 'rect':
        return {
          width: width || '100%',
          height: height || 100,
          borderRadius: 8,
        };
      case 'text':
        return {
          width: width || '100%',
          height: height || 20,
          borderRadius: 4,
        };
      default:
        return {};
    }
  };

  const styles = useMemo(() => getStyles(theme), [theme]);

  return (
    <View style={[styles.container, getShapeStyle(), style]}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.shimmer, animatedStyle]} />
    </View>
  );
};

export const SkeletonFeed: React.FC = () => {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  return (
    <View style={styles.feedContainer}>
      <View style={styles.feedHeader}>
        <Skeleton shape="circle" width={40} height={40} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Skeleton shape="text" width="60%" height={16} />
          <Skeleton shape="text" width="40%" height={12} style={{ marginTop: 8 }} />
        </View>
      </View>
      <Skeleton shape="rect" width="100%" height={200} style={{ marginTop: 12 }} />
      <View style={styles.feedFooter}>
        <Skeleton shape="text" width={80} height={20} />
        <Skeleton shape="text" width={80} height={20} />
      </View>
    </View>
  );
};

export const SkeletonProfile: React.FC = () => {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  return (
    <View style={styles.profileContainer}>
      <View style={styles.profileHeader}>
        <Skeleton shape="circle" width={80} height={80} />
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Skeleton shape="text" width="70%" height={20} />
          <Skeleton shape="text" width="50%" height={16} style={{ marginTop: 8 }} />
        </View>
      </View>
      <View style={styles.profileContent}>
        <Skeleton shape="rect" width="100%" height={120} style={{ marginBottom: 12 }} />
        <Skeleton shape="text" width="100%" height={16} style={{ marginBottom: 8 }} />
        <Skeleton shape="text" width="80%" height={16} />
      </View>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.skeletonBackground,
    overflow: 'hidden',
  },
  shimmer: {
    backgroundColor: theme.colors.skeletonShimmer,
  },
  feedContainer: {
    backgroundColor: theme.colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  profileContainer: {
    backgroundColor: theme.colors.card,
    padding: 16,
    borderRadius: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileContent: {
    marginTop: 16,
  }
});
