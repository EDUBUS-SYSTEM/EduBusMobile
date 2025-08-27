import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function ParentExploreScreen() {
  const features = [
    {
      id: 1,
      title: 'Theo dõi xe buýt',
      description: 'Xem vị trí xe buýt real-time',
      icon: 'location',
      color: '#4CAF50'
    },
    {
      id: 2,
      title: 'Lịch trình',
      description: 'Xem lịch trình xe buýt hàng ngày',
      icon: 'calendar',
      color: '#2196F3'
    },
    {
      id: 3,
      title: 'Báo cáo',
      description: 'Xem báo cáo chi tiết về chuyến đi',
      icon: 'analytics',
      color: '#FF9800'
    },
    {
      id: 4,
      title: 'Thông báo',
      description: 'Cài đặt thông báo cho chuyến đi',
      icon: 'notifications',
      color: '#9C27B0'
    },
    {
      id: 5,
      title: 'Hướng dẫn',
      description: 'Hướng dẫn sử dụng ứng dụng',
      icon: 'help-circle',
      color: '#607D8B'
    },
    {
      id: 6,
      title: 'Phản hồi',
      description: 'Gửi phản hồi và góp ý',
      icon: 'chatbubble',
      color: '#E91E63'
    }
  ];

  const news = [
    {
      id: 1,
      title: 'Cập nhật lịch trình mới',
      date: 'Hôm nay',
      content: 'Lịch trình xe buýt đã được cập nhật cho tuần tới'
    },
    {
      id: 2,
      title: 'Thông báo bảo trì',
      date: '2 ngày trước',
      content: 'Xe buýt số 5 sẽ tạm ngưng hoạt động để bảo trì'
    },
    {
      id: 3,
      title: 'Tính năng mới',
      date: '1 tuần trước',
      content: 'Thêm tính năng theo dõi vị trí real-time'
    }
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <LinearGradient
        colors={['#FFD700', '#FFEB3B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: 60,
          paddingBottom: 30,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
        }}>
        <Text style={{
          color: '#000000',
          fontFamily: 'RobotoSlab-Bold',
          fontSize: 28,
          textAlign: 'center'
        }}>
          Khám phá
        </Text>
        <Text style={{
          color: '#000000',
          fontFamily: 'RobotoSlab-Regular',
          fontSize: 16,
          textAlign: 'center',
          marginTop: 5
        }}>
          Khám phá các tính năng mới và thông tin hữu ích
        </Text>
      </LinearGradient>

      <View style={{ padding: 20 }}>
        {/* Quick Stats */}
        <View style={{
          backgroundColor: '#E0F7FA',
          borderRadius: 15,
          padding: 20,
          marginBottom: 25
        }}>
          <Text style={{
            fontFamily: 'RobotoSlab-Bold',
            fontSize: 18,
            color: '#000000',
            marginBottom: 15
          }}>
            Thống kê nhanh
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{
                fontFamily: 'RobotoSlab-Bold',
                fontSize: 24,
                color: '#01CBCA'
              }}>
                15
              </Text>
              <Text style={{
                fontFamily: 'RobotoSlab-Regular',
                fontSize: 12,
                color: '#666'
              }}>
                Chuyến đi
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{
                fontFamily: 'RobotoSlab-Bold',
                fontSize: 24,
                color: '#01CBCA'
              }}>
                98%
              </Text>
              <Text style={{
                fontFamily: 'RobotoSlab-Regular',
                fontSize: 12,
                color: '#666'
              }}>
                Đúng giờ
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{
                fontFamily: 'RobotoSlab-Bold',
                fontSize: 24,
                color: '#01CBCA'
              }}>
                4.8
              </Text>
              <Text style={{
                fontFamily: 'RobotoSlab-Regular',
                fontSize: 12,
                color: '#666'
              }}>
                Đánh giá
              </Text>
            </View>
          </View>
        </View>

        {/* Features Grid */}
        <Text style={{
          fontFamily: 'RobotoSlab-Bold',
          fontSize: 20,
          color: '#000000',
          marginBottom: 15
        }}>
          Tính năng chính
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 15 }}>
          {features.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 15,
                padding: 20,
                width: '47%',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
                borderWidth: 1,
                borderColor: '#E0E0E0'
              }}>
              <View style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: `${feature.color}20`,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10
              }}>
                <Ionicons name={feature.icon as any} size={24} color={feature.color} />
              </View>
              <Text style={{
                fontFamily: 'RobotoSlab-Bold',
                fontSize: 14,
                color: '#000000',
                textAlign: 'center',
                marginBottom: 5
              }}>
                {feature.title}
              </Text>
              <Text style={{
                fontFamily: 'RobotoSlab-Regular',
                fontSize: 12,
                color: '#666',
                textAlign: 'center'
              }}>
                {feature.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* News Section */}
        <View style={{ marginTop: 30 }}>
          <Text style={{
            fontFamily: 'RobotoSlab-Bold',
            fontSize: 20,
            color: '#000000',
            marginBottom: 15
          }}>
            Tin tức & Cập nhật
          </Text>

          {news.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 15,
                padding: 20,
                marginBottom: 15,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
                borderWidth: 1,
                borderColor: '#E0E0E0'
              }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{
                  fontFamily: 'RobotoSlab-Bold',
                  fontSize: 16,
                  color: '#000000'
                }}>
                  {item.title}
                </Text>
                <Text style={{
                  fontFamily: 'RobotoSlab-Regular',
                  fontSize: 12,
                  color: '#01CBCA'
                }}>
                  {item.date}
                </Text>
              </View>
              <Text style={{
                fontFamily: 'RobotoSlab-Regular',
                fontSize: 14,
                color: '#666'
              }}>
                {item.content}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={{ marginTop: 30 }}>
          <Text style={{
            fontFamily: 'RobotoSlab-Bold',
            fontSize: 20,
            color: '#000000',
            marginBottom: 15
          }}>
            Thao tác nhanh
          </Text>

          <View style={{ flexDirection: 'row', gap: 15 }}>
            <TouchableOpacity style={{
              flex: 1,
              backgroundColor: '#01CBCA',
              borderRadius: 15,
              padding: 15,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3
            }}>
              <Ionicons name="refresh" size={24} color="#FFFFFF" />
              <Text style={{
                fontFamily: 'RobotoSlab-Medium',
                fontSize: 14,
                color: '#FFFFFF',
                marginTop: 5
              }}>
                Làm mới
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={{
              flex: 1,
              backgroundColor: '#FF9800',
              borderRadius: 15,
              padding: 15,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3
            }}>
              <Ionicons name="share" size={24} color="#FFFFFF" />
              <Text style={{
                fontFamily: 'RobotoSlab-Medium',
                fontSize: 14,
                color: '#FFFFFF',
                marginTop: 5
              }}>
                Chia sẻ
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
