import { FC, useState } from 'react';
import { Text } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AuthStackParamList } from '@/navigator/auth/AuthNavigator';
import { yupValidate } from '@/utils/validator';
import { emailSchema } from '@/validation/auth';
import { theme } from '@/utils/theme';
import { runAxiosAsync } from '@/api/runAxiosAsync';
import client from '@/api/client';
import { showErrorToast } from '@/components/ErrorToast';
import { showToast } from '@/components/Toast';
import { useToast } from '@/components/ui/toast';
import { AuthButton, AuthInput, AuthLayout, AuthLink } from '@/components/AuthForm';

const ForgetPassword: FC = () => {
    const { navigate } = useNavigation<NavigationProp<AuthStackParamList>>();
    const [email, setEmail] = useState('');
    const [ emailInvalid, setEmailInvalid] = useState(false);
    const [loading, setLoading] = useState(false);
    const canSend = Boolean(email.trim());
    const toast = useToast();
    const [toastId, setToastId] = useState(0);

    const handleSubmit = async () => {
        const { values, error } = await yupValidate(emailSchema, { email });

        if(error) {
            if(error.toLowerCase().includes("email")|| error.toLowerCase().includes("user")) setEmailInvalid(true);
            showErrorToast({ description: error, toast, toastId, setToastId });
            setLoading(false);
            return
        }

        setLoading(true);
        const res = await runAxiosAsync<{message: string}>(client.post('auth/forgot-password', values));

        if(res.error){
            if(res.error.toLowerCase().includes("email") || res.error.toLowerCase().includes("user ")) setEmailInvalid(true);
            showErrorToast({ description: res.error, toast, toastId, setToastId });
            setLoading(false);
            return
        }

        showToast({ description: res.data?.message || "Password reset link sent", toast, toastId, setToastId });
        setLoading(false);
        navigate("SignIn");
    }

    return (
        <AuthLayout
            title='Forgot Password'
            subtitle="Enter your account email and we'll send you a link to reset your password."
            footer={
                <>
                    <AuthLink label='Back to Sign In' onPress={() => navigate("SignIn")} />
                    <AuthLink label='Create an account' onPress={() => navigate("SignUp")} muted />
                </>
            }
        >
            <AuthInput
                label='Email'
                icon='mail'
                placeholder='you@company.com'
                keyboardType='email-address'
                value={email}
                invalid={emailInvalid}
                onChangeText={(value) => {
                    setEmailInvalid(false);
                    setEmail(value);
                }}
            />
            <Text className='-mt-1 mb-4 text-xs' style={{ color: theme.colors.textMuted }}>The reset link expires after 20 minutes.</Text>
            <AuthButton label='Send Reset Link' onPress={handleSubmit} disabled={!canSend} loading={loading} />
        </AuthLayout>
    );
};

export default ForgetPassword;
