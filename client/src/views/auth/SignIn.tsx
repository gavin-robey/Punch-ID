import { FC, useState } from 'react';
import { Text, View } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AuthStackParamList } from '@/navigator/auth/AuthNavigator';
import { signInSchema } from '@/validation/auth';
import { yupValidate } from '@/utils/validator';
import { theme } from '@/utils/theme';
import useAuth from '@/hooks/useAuth';
import { showErrorToast } from '@/components/ErrorToast';
import { useToast } from '@/components/ui/toast';
import { AuthButton, AuthInput, AuthLayout, AuthLink } from '@/components/AuthForm';

const SignIn: FC = () => {
    const { navigate } = useNavigation<NavigationProp<AuthStackParamList>>();
    const [email, setEmail] = useState('');
    const toast = useToast();
    const [toastId, setToastId] = useState(0);
    const [password, setPassword] = useState('');
    const [emailInvalid, setEmailInvalid] = useState(false);
    const [passwordInvalid, setPasswordInvalid] = useState(false);
    const [loading, setLoading] = useState(false);
    const canSignIn = Boolean(email.trim() && password.trim() && !loading);
    const { signIn } = useAuth();

    const clearInvalid = () => {
        setEmailInvalid(false);
        setPasswordInvalid(false);
    };

    const handleSubmit = async () => {
        setLoading(true);
        const { values, error } = await yupValidate(signInSchema, { email, password,});

        if(error) {
            if(error.toLowerCase().includes("email")|| error.toLowerCase().includes("user")) setEmailInvalid(true);
            if(error.toLowerCase().includes("password")) setPasswordInvalid(true);
            showErrorToast({ description: error, toast, toastId, setToastId });
            setLoading(false);
            return
        }

        if(values) await signIn(values, setEmailInvalid, setPasswordInvalid, showErrorToast, { toast, toastId, setToastId });
        setLoading(false);
    };

    return (
        <AuthLayout
            title='Sign In'
            subtitle='Log in with your email and password to manage your punch lists.'
            footer={
                <>
                    <Text className='text-sm' style={{ color: theme.colors.textSecondary }}>New to PUNCH ID?</Text>
                    <AuthLink label='Create an account' onPress={() => navigate("SignUp")} />
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
                    setEmail(value);
                    clearInvalid();
                }}
            />
            <AuthInput
                label='Password'
                icon='lock'
                placeholder='Your password'
                secure
                value={password}
                invalid={passwordInvalid}
                onChangeText={(value) => {
                    setPassword(value);
                    clearInvalid();
                }}
            />
            <View className='-mt-1 mb-4 items-end'>
                <AuthLink label='Forgot password?' onPress={() => navigate("ForgetPassword")} muted />
            </View>
            <AuthButton label='Sign In' onPress={handleSubmit} disabled={!canSignIn} loading={loading} />
        </AuthLayout>
    );
};

export default SignIn;
