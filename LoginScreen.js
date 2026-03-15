// ============================================================
// FILE 19-A: frontend/src/screens/LoginScreen.js
// شاشة تسجيل الدخول
// ============================================================

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, ScrollView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email || !password)
      return Alert.alert('خطأ', 'يرجى إدخال البريد الإلكتروني وكلمة المرور');

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      Alert.alert('خطأ في تسجيل الدخول', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={styles.logoArea}>
          <Text style={styles.logo}>🛍️</Text>
          <Text style={styles.appName}>سوق مصر</Text>
          <Text style={styles.subtitle}>متجرك الإلكتروني الأول</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.title}>تسجيل الدخول</Text>

          <Text style={styles.label}>البريد الإلكتروني</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="example@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              textAlign="right"
            />
          </View>

          <Text style={styles.label}>كلمة المرور</Text>
          <View style={styles.inputWrap}>
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.inputIcon}>
              <Ionicons name={showPass ? 'eye' : 'eye-off-outline'} size={20} color="#999" />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={!showPass}
              textAlign="right"
            />
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.loginBtnText}>دخول</Text>
            }
          </TouchableOpacity>

          <View style={styles.registerRow}>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>إنشاء حساب جديد</Text>
            </TouchableOpacity>
            <Text style={styles.registerText}>ليس لديك حساب؟</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ============================================================
// FILE 19-B: frontend/src/screens/RegisterScreen.js — داخل نفس الملف
// ============================================================

export function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '',
    password: '', confirm_password: '', role: 'buyer'
  });
  const [loading, setLoading] = useState(false);
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleRegister = async () => {
    if (!form.full_name || !form.email || !form.password)
      return Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
    if (form.password !== form.confirm_password)
      return Alert.alert('خطأ', 'كلمتا المرور غير متطابقتين');
    if (form.password.length < 6)
      return Alert.alert('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');

    setLoading(true);
    try {
      await register({
        full_name: form.full_name,
        email: form.email.trim().toLowerCase(),
        phone: form.phone,
        password: form.password,
        role: form.role
      });
    } catch (err) {
      Alert.alert('خطأ في التسجيل', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoArea}>
          <Text style={styles.logo}>🛍️</Text>
          <Text style={styles.appName}>سوق مصر</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>إنشاء حساب جديد</Text>

          {/* Role Selector */}
          <View style={{ flexDirection: 'row', marginBottom: 16, gap: 8 }}>
            <TouchableOpacity
              style={[styles.roleBtn, form.role === 'buyer' && styles.roleBtnActive]}
              onPress={() => update('role', 'buyer')}
            >
              <Ionicons name="person" size={18} color={form.role === 'buyer' ? '#fff' : '#666'} />
              <Text style={{ color: form.role === 'buyer' ? '#fff' : '#666', marginLeft: 4 }}>مشتري</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleBtn, form.role === 'merchant' && styles.roleBtnActiveMerchant]}
              onPress={() => update('role', 'merchant')}
            >
              <Ionicons name="storefront" size={18} color={form.role === 'merchant' ? '#fff' : '#666'} />
              <Text style={{ color: form.role === 'merchant' ? '#fff' : '#666', marginLeft: 4 }}>تاجر</Text>
            </TouchableOpacity>
          </View>

          {[
            ['الاسم الكامل *',       'full_name',       'text',       'person-outline'],
            ['البريد الإلكتروني *',  'email',           'email-address', 'mail-outline'],
            ['رقم الهاتف',           'phone',           'phone-pad',  'call-outline'],
            ['كلمة المرور *',        'password',        'default',    'lock-closed-outline'],
            ['تأكيد كلمة المرور *',  'confirm_password','default',    'lock-closed-outline'],
          ].map(([label, key, keyboard, icon]) => (
            <View key={key}>
              <Text style={styles.label}>{label}</Text>
              <View style={styles.inputWrap}>
                <Ionicons name={icon} size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={form[key]}
                  onChangeText={v => update(key, v)}
                  keyboardType={keyboard === 'email-address' ? 'email-address' : keyboard === 'phone-pad' ? 'phone-pad' : 'default'}
                  secureTextEntry={key.includes('password')}
                  autoCapitalize="none"
                  textAlign="right"
                />
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.7 }, form.role === 'merchant' && { backgroundColor: '#2c3e50' }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>إنشاء الحساب</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={{ alignItems: 'center', marginTop: 12 }} onPress={() => navigation.navigate('Login')}>
            <Text style={{ color: '#e74c3c' }}>لديك حساب؟ سجل الدخول</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:     { flexGrow: 1, backgroundColor: '#fff', paddingBottom: 30 },
  logoArea:      { backgroundColor: '#e74c3c', alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  logo:          { fontSize: 60 },
  appName:       { fontSize: 28, fontWeight: 'bold', color: '#fff', marginTop: 8 },
  subtitle:      { color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  form:          { padding: 24 },
  title:         { fontSize: 22, fontWeight: 'bold', color: '#2c3e50', marginBottom: 20, textAlign: 'right' },
  label:         { fontSize: 14, color: '#555', marginBottom: 6, textAlign: 'right' },
  inputWrap:     { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#fafafa', marginBottom: 14 },
  inputIcon:     { marginRight: 8 },
  input:         { flex: 1, paddingVertical: 12, fontSize: 15, color: '#333' },
  loginBtn:      { backgroundColor: '#e74c3c', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 8, elevation: 2 },
  loginBtnText:  { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  registerRow:   { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 16 },
  registerText:  { color: '#666' },
  registerLink:  { color: '#e74c3c', fontWeight: '600' },
  roleBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#f5f5f5' },
  roleBtnActive: { backgroundColor: '#e74c3c', borderColor: '#e74c3c' },
  roleBtnActiveMerchant: { backgroundColor: '#2c3e50', borderColor: '#2c3e50' },
});
