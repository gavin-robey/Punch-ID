import React, { FC, ReactNode, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, Text, TextInputProps, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AntDesign } from '@react-native-vector-icons/ant-design';
import { theme } from '@/utils/theme';
import { Input, InputField } from './ui/input';
import { Spinner } from './ui/spinner';

const styles = {
    card: `rounded-2xl border p-5`,
    label: `mb-2 text-xs font-bold uppercase`,
    button: `mt-2 flex-row items-center justify-center rounded-lg py-3.5`,
    buttonText: `text-base font-extrabold uppercase tracking-wide`,
};

interface LayoutProps {
    title: string;
    subtitle: string;
    children: ReactNode;
    // links under the card, e.g. "Sign Up" / "Forgot password?"
    footer?: ReactNode;
}

// shared shell for the auth screens: wordmark, page title with the red underline, form card and footer links
export const AuthLayout: FC<LayoutProps> = ({ title, subtitle, children, footer }) => {
    const insets = useSafeAreaInsets();

    return (
        <KeyboardAvoidingView behavior='padding' className='flex-1' style={{ backgroundColor: theme.colors.backgroundSecondary }}>
            <ScrollView
                className='px-5'
                contentContainerStyle={{ flexGrow: 1, paddingTop: 24, paddingBottom: insets.bottom + 24 }}
                keyboardShouldPersistTaps='handled'
                showsVerticalScrollIndicator={false}
            >
                <View className='w-full max-w-[520px] flex-1 self-center'>
                    <View>
                        <View className='flex-row items-baseline'>
                            <Text className='text-3xl font-black italic' style={{ color: theme.colors.textPrimary }}>PUNCH</Text>
                            <Text className='ml-1 text-3xl font-black italic' style={{ color: theme.colors.primary }}>ID</Text>
                        </View>
                        <Text className='text-[10px] font-bold tracking-[2px]' style={{ color: theme.colors.textSecondary }}>SMART PUNCH LIST TAPE</Text>
                    </View>

                    <View className='flex-1 justify-center py-8'>
                        <Text className='text-3xl font-black uppercase' style={{ color: theme.colors.textPrimary }}>{title}</Text>
                        <View className='mt-1 h-1 w-12 rounded-full' style={{ backgroundColor: theme.colors.primary }} />
                        <Text className='mb-6 mt-3 text-sm' style={{ color: theme.colors.textSecondary }}>{subtitle}</Text>

                        <View className={styles.card} style={{ backgroundColor: theme.colors.backgroundPrimary, borderColor: theme.colors.border }}>
                            {children}
                        </View>
                    </View>

                    {footer && <View className='flex-row items-center justify-between'>{footer}</View>}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

interface InputProps {
    label: string;
    icon: 'mail' | 'lock' | 'user';
    value: string;
    onChangeText: (value: string) => void;
    placeholder: string;
    invalid?: boolean;
    secure?: boolean;
    keyboardType?: TextInputProps['keyboardType'];
    autoCapitalize?: TextInputProps['autoCapitalize'];
}

// themed text field, password fields get a show/hide toggle and invalid fields turn red
export const AuthInput: FC<InputProps> = ({ label, icon, value, onChangeText, placeholder, invalid, secure, keyboardType, autoCapitalize = 'none' }) => {
    const [hidden, setHidden] = useState(true);
    const accent = invalid ? theme.colors.error : theme.colors.iconMuted;

    return (
        <View className='mb-4'>
            <Text className={styles.label} style={{ color: invalid ? theme.colors.error : theme.colors.textSecondary }}>{label}</Text>
            <Input isInvalid={invalid} className='h-12 rounded-xl border bg-transparent' style={{ borderColor: invalid ? theme.colors.error : theme.colors.border }}>
                <View className='pl-3.5'>
                    <AntDesign name={icon} size={16} color={accent} />
                </View>
                <InputField
                    placeholder={placeholder}
                    placeholderTextColor={theme.colors.textMuted}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={secure && hidden}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    autoCorrect={false}
                    style={{ color: theme.colors.textPrimary }}
                />
                {secure && (
                    <TouchableOpacity className='pr-3.5' onPress={() => setHidden(!hidden)} hitSlop={8}>
                        <AntDesign name={hidden ? 'eye-invisible' : 'eye'} size={16} color={theme.colors.iconMuted} />
                    </TouchableOpacity>
                )}
            </Input>
        </View>
    );
};

interface ButtonProps {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
}

export const AuthButton: FC<ButtonProps> = ({ label, onPress, disabled, loading }) => {
    const active = !disabled && !loading;

    return (
        <TouchableOpacity
            className={styles.button}
            style={{
                backgroundColor: active ? theme.colors.primary : theme.colors.backgroundTertiary,
                shadowColor: theme.colors.primary,
                shadowOpacity: active ? 0.5 : 0,
                shadowRadius: 12,
            }}
            onPress={onPress}
            disabled={!active}
        >
            {loading ? (
                <Spinner size='small' color={theme.colors.primaryForeground} />
            ) : (
                <Text className={styles.buttonText} style={{ color: active ? theme.colors.primaryForeground : theme.colors.textMuted }}>{label}</Text>
            )}
        </TouchableOpacity>
    );
};

export const AuthLink: FC<{ label: string; onPress: () => void; muted?: boolean }> = ({ label, onPress, muted }) => (
    <TouchableOpacity onPress={onPress} hitSlop={8}>
        <Text className='text-sm font-semibold' style={{ color: muted ? theme.colors.textSecondary : theme.colors.primary }}>{label}</Text>
    </TouchableOpacity>
);
