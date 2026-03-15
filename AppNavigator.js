// ============================================================
// FILE 18: frontend/src/navigation/AppNavigator.js
// نظام التنقل الكامل بين الشاشات
// ============================================================

import React, { useContext } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

// -------- Buyer Screens --------
import HomeScreen         from '../screens/HomeScreen';
import SearchScreen       from '../screens/SearchScreen';
import CartScreen         from '../screens/CartScreen';
import CheckoutScreen     from '../screens/CheckoutScreen';
import OrdersScreen       from '../screens/OrdersScreen';
import OrderDetailScreen  from '../screens/OrderDetailScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import ProfileScreen      from '../screens/ProfileScreen';
import WishlistScreen     from '../screens/WishlistScreen';

// -------- Auth Screens --------
import LoginScreen    from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// -------- Merchant Screens --------
import MerchantDashboard    from '../screens/merchant/MerchantDashboard';
import MerchantProducts     from '../screens/merchant/MerchantProducts';
import MerchantOrders       from '../screens/merchant/MerchantOrders';
import AddProductScreen     from '../screens/merchant/AddProductScreen';
import DailyReportScreen    from '../screens/merchant/DailyReportScreen';
import MonthlyReportScreen  from '../screens/merchant/MonthlyReportScreen';
import RegisterMerchantScreen from '../screens/merchant/RegisterMerchantScreen';
import MerchantProfileScreen from '../screens/merchant/MerchantProfileScreen';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

// ===== تابز المشتري =====
function BuyerTabs() {
  const { cartCount } = useContext(AuthContext);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   '#e74c3c',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#eee', height: 60, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 11 },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            'الرئيسية': focused ? 'home'    : 'home-outline',
            'البحث':    focused ? 'search'  : 'search-outline',
            'السلة':    focused ? 'cart'    : 'cart-outline',
            'طلباتي':   focused ? 'receipt' : 'receipt-outline',
            'حسابي':    focused ? 'person'  : 'person-outline',
          };
          return <Ionicons name={icons[route.name] || 'apps'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="الرئيسية" component={HomeScreen} />
      <Tab.Screen name="البحث"    component={SearchScreen} />
      <Tab.Screen
        name="السلة"
        component={CartScreen}
        options={{
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#e74c3c', fontSize: 10 }
        }}
      />
      <Tab.Screen name="طلباتي"   component={OrdersScreen} />
      <Tab.Screen name="حسابي"    component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ===== تابز التاجر =====
function MerchantTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   '#2c3e50',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#eee', height: 60, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 11 },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            'لوحة التحكم': focused ? 'grid'      : 'grid-outline',
            'المنتجات':    focused ? 'cube'      : 'cube-outline',
            'الطلبات':     focused ? 'receipt'   : 'receipt-outline',
            'التقارير':    focused ? 'bar-chart' : 'bar-chart-outline',
            'المتجر':      focused ? 'storefront': 'storefront-outline',
          };
          return <Ionicons name={icons[route.name] || 'apps'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="لوحة التحكم" component={MerchantDashboard} />
      <Tab.Screen name="المنتجات"    component={MerchantProducts} />
      <Tab.Screen name="الطلبات"     component={MerchantOrders} />
      <Tab.Screen name="التقارير"    component={DailyReportScreen} />
      <Tab.Screen name="المتجر"      component={MerchantProfileScreen} />
    </Tab.Navigator>
  );
}

// ===== التطبيق الكامل =====
export default function AppNavigator() {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 40, marginBottom: 20 }}>🛍️</Text>
      <ActivityIndicator size="large" color="#e74c3c" />
      <Text style={{ color: '#999', marginTop: 10 }}>جاري التحميل...</Text>
    </View>
  );

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>

        {!user ? (
          // ========= شاشات عدم تسجيل الدخول =========
          <>
            <Stack.Screen name="Login"    component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // ========= شاشات التطبيق =========
          <>
            <Stack.Screen
              name="Main"
              component={user.role === 'merchant' ? MerchantTabs : BuyerTabs}
            />

            {/* شاشات المشتري الإضافية */}
            <Stack.Screen
              name="ProductDetail"
              component={ProductDetailScreen}
              options={{ headerShown: true, title: 'تفاصيل المنتج', headerStyle: { backgroundColor: '#e74c3c' }, headerTintColor: '#fff' }}
            />
            <Stack.Screen
              name="Checkout"
              component={CheckoutScreen}
              options={{ headerShown: true, title: 'إتمام الطلب', headerStyle: { backgroundColor: '#e74c3c' }, headerTintColor: '#fff' }}
            />
            <Stack.Screen
              name="OrderDetail"
              component={OrderDetailScreen}
              options={{ headerShown: true, title: 'تفاصيل الطلب', headerStyle: { backgroundColor: '#e74c3c' }, headerTintColor: '#fff' }}
            />
            <Stack.Screen
              name="Wishlist"
              component={WishlistScreen}
              options={{ headerShown: true, title: 'المفضلة', headerStyle: { backgroundColor: '#e74c3c' }, headerTintColor: '#fff' }}
            />

            {/* شاشات التاجر الإضافية */}
            <Stack.Screen
              name="AddProduct"
              component={AddProductScreen}
              options={{ headerShown: true, title: 'إضافة منتج', headerStyle: { backgroundColor: '#2c3e50' }, headerTintColor: '#fff' }}
            />
            <Stack.Screen
              name="EditProduct"
              component={AddProductScreen}
              options={{ headerShown: true, title: 'تعديل منتج', headerStyle: { backgroundColor: '#2c3e50' }, headerTintColor: '#fff' }}
            />
            <Stack.Screen
              name="MonthlyReport"
              component={MonthlyReportScreen}
              options={{ headerShown: true, title: 'التقرير الشهري', headerStyle: { backgroundColor: '#2c3e50' }, headerTintColor: '#fff' }}
            />
            <Stack.Screen
              name="RegisterMerchant"
              component={RegisterMerchantScreen}
              options={{ headerShown: true, title: 'تسجيل متجر جديد', headerStyle: { backgroundColor: '#2c3e50' }, headerTintColor: '#fff' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
