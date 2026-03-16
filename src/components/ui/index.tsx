import React from 'react';
import { Text as RNText, TouchableOpacity, TextInput, View, ActivityIndicator, StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/src/constants/tokens';

// ── TEXT ──────────────────────────────────────────────────
interface TextProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'sm' | 'xs' | 'label';
  color?: string;
  style?: TextStyle | TextStyle[];
  numberOfLines?: number;
}

export function Text({ children, variant = 'body', color, style, numberOfLines }: TextProps) {
  const variantStyles: Record<string, TextStyle> = {
    h1:    { fontSize: Typography['4xl'], fontWeight: Typography.semibold as any, color: Colors.ice, letterSpacing: -0.5 },
    h2:    { fontSize: Typography['3xl'], fontWeight: Typography.semibold as any, color: Colors.ice },
    h3:    { fontSize: Typography['2xl'], fontWeight: Typography.semibold as any, color: Colors.ice },
    body:  { fontSize: Typography.base,  fontWeight: Typography.regular as any,  color: Colors.ice2 },
    sm:    { fontSize: Typography.sm,    fontWeight: Typography.regular as any,  color: Colors.ice3 },
    xs:    { fontSize: Typography.xs,    fontWeight: Typography.regular as any,  color: Colors.ice3 },
    label: { fontSize: Typography.xs,    fontWeight: Typography.semibold as any, color: Colors.ice3, letterSpacing: 1.5, textTransform: 'uppercase' },
  };
  return (
    <RNText style={[variantStyles[variant], color ? { color } : undefined, style]} numberOfLines={numberOfLines}>
      {children}
    </RNText>
  );
}

// ── BUTTON ────────────────────────────────────────────────
interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', loading, disabled, fullWidth, style }: ButtonProps) {
  const variantStyle: Record<string, ViewStyle> = {
    primary:   { backgroundColor: Colors.accent },
    secondary: { backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border },
    ghost:     { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.border },
    danger:    { backgroundColor: Colors.error },
  };
  const textColor: Record<string, string> = {
    primary: Colors.white,
    secondary: Colors.ice2,
    ghost: Colors.ice3,
    danger: Colors.white,
  };
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled || loading}
      style={[btn.base, variantStyle[variant], fullWidth && { width: '100%' }, (disabled || loading) && { opacity: 0.5 }, style]}
    >
      {loading ? <ActivityIndicator size="small" color={textColor[variant]} /> : <RNText style={[btn.label, { color: textColor[variant] }]}>{label}</RNText>}
    </TouchableOpacity>
  );
}

const btn = StyleSheet.create({
  base:  { height: 48, borderRadius: Radius.md, paddingHorizontal: Spacing.xl, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: Typography.base, fontWeight: Typography.semibold as any },
});

// ── INPUT ─────────────────────────────────────────────────
interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'phone-pad' | 'email-address' | 'numeric';
  returnKeyType?: 'done' | 'send' | 'next' | 'go';
  onSubmitEditing?: () => void;
  multiline?: boolean;
  numberOfLines?: number;
  style?: ViewStyle | TextStyle;
  autoFocus?: boolean;
  maxLength?: number;
}

export function Input({ value, onChangeText, placeholder, secureTextEntry, keyboardType, returnKeyType, onSubmitEditing, multiline, numberOfLines, style, autoFocus, maxLength }: InputProps) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.ice3}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      returnKeyType={returnKeyType}
      onSubmitEditing={onSubmitEditing}
      multiline={multiline}
      numberOfLines={numberOfLines}
      autoFocus={autoFocus}
      maxLength={maxLength}
      style={[input.base, style]}
    />
  );
}

const input = StyleSheet.create({
  base: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    color: Colors.ice,
    fontSize: Typography.base,
    fontWeight: Typography.regular as any,
  },
});

// ── BADGE ─────────────────────────────────────────────────
interface BadgeProps { label: string; color?: string; bg?: string; }
export function Badge({ label, color = Colors.accent, bg = Colors.accentBg }: BadgeProps) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3 }}>
      <RNText style={{ fontSize: Typography.xs, fontWeight: Typography.semibold as any, color }}>{label}</RNText>
    </View>
  );
}
