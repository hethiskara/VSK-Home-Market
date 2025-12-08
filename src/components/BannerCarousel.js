import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - 32;
const BANNER_HEIGHT = 180;

const BannerCarousel = ({ banners = [] }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (banners.length > 1) {
      intervalRef.current = setInterval(() => {
        const nextIndex = (activeIndex + 1) % banners.length;
        scrollRef.current?.scrollTo({
          x: nextIndex * BANNER_WIDTH,
          animated: true,
        });
        setActiveIndex(nextIndex);
      }, 4000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeIndex, banners.length]);

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / BANNER_WIDTH);
    if (index !== activeIndex && index >= 0 && index < banners.length) {
      setActiveIndex(index);
    }
  };

  const goToSlide = (index) => {
    scrollRef.current?.scrollTo({
      x: index * BANNER_WIDTH,
      animated: true,
    });
    setActiveIndex(index);
  };

  if (banners.length === 0) {
    return (
      <View style={styles.placeholder}>
        <View style={styles.placeholderInner} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {banners.map((banner, index) => (
          <TouchableOpacity key={banner.id || index} activeOpacity={0.9}>
            <Image
              source={{ uri: banner.image }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {banners.length > 1 && (
        <>
          <TouchableOpacity
            style={[styles.arrow, styles.arrowLeft]}
            onPress={() => goToSlide((activeIndex - 1 + banners.length) % banners.length)}
          >
            <View style={styles.arrowIcon}>
              <View style={[styles.arrowLine, styles.arrowLineTop]} />
              <View style={[styles.arrowLine, styles.arrowLineBottom]} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.arrow, styles.arrowRight]}
            onPress={() => goToSlide((activeIndex + 1) % banners.length)}
          >
            <View style={[styles.arrowIcon, styles.arrowIconRight]}>
              <View style={[styles.arrowLine, styles.arrowLineTop]} />
              <View style={[styles.arrowLine, styles.arrowLineBottom]} />
            </View>
          </TouchableOpacity>

          <View style={styles.pagination}>
            {banners.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => goToSlide(index)}
              >
                <View
                  style={[
                    styles.dot,
                    index === activeIndex && styles.dotActive,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  scrollView: {
    borderRadius: 12,
  },
  scrollContent: {
    alignItems: 'center',
  },
  bannerImage: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: 12,
  },
  placeholder: {
    marginHorizontal: 16,
    marginVertical: 12,
    height: BANNER_HEIGHT,
    borderRadius: 12,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#D0D0D0',
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 36,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowLeft: {
    left: 0,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  arrowRight: {
    right: 0,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  arrowIcon: {
    width: 12,
    height: 12,
  },
  arrowIconRight: {
    transform: [{ rotate: '180deg' }],
  },
  arrowLine: {
    position: 'absolute',
    width: 10,
    height: 2,
    backgroundColor: '#666',
    left: 0,
  },
  arrowLineTop: {
    top: 2,
    transform: [{ rotate: '-45deg' }],
  },
  arrowLineBottom: {
    bottom: 2,
    transform: [{ rotate: '45deg' }],
  },
  pagination: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: '#FF6B35',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

export default BannerCarousel;

