import { FC, useState } from 'react';
import { Text } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AuthStackParamList } from '@/navigator/auth/AuthNavigator';
import { newUserSchema } from '@/validation/auth';
import { yupValidate } from '@/utils/validator';
import { theme } from '@/utils/theme';
import { runAxiosAsync } from '@/api/runAxiosAsync';
import client from '@/api/client';
import useAuth from '@/hooks/useAuth';
import { showErrorToast } from '@/components/ErrorToast';
import { showToast } from '@/components/Toast';
import { useToast } from '@/components/ui/toast';
import { AuthButton, AuthInput, AuthLayout, AuthLink } from '@/components/AuthForm';

const SignUp: FC = () => {
    const { navigate } = useNavigation<NavigationProp<AuthStackParamList>>();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const toast = useToast();
    const [toastId, setToastId] = useState(0);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [emailInvalid, setEmailInvalid] = useState(false);
    const [passwordInvalid, setPasswordInvalid] = useState(false);
    const [loading, setLoading] = useState(false);
    const canSignUp = Boolean(
        name.trim() &&
        email.trim() &&
        password.trim() &&
        confirmPassword.trim() &&
        !loading
    );
    const { signIn } = useAuth();

    const clearInvalid = () => {
        setEmailInvalid(false);
        setPasswordInvalid(false);
    };

    const handleSubmit = async () => {
        setLoading(true);
        const { values, error } = await yupValidate(newUserSchema, {
            email,
            password,
            name,
            confirmPassword
        });

        if(error) {
            if(error.toLowerCase().includes("email")|| error.toLowerCase().includes("user ")) setEmailInvalid(true);
            if(error.toLowerCase().includes("password")) setPasswordInvalid(true);
            showErrorToast({ description: error, toast, toastId, setToastId });
            setLoading(false);
            return
        }

        const res = await runAxiosAsync<{message: string}>(client.post('auth/sign-up', values));

        if(res.error){
            if(res.error.toLowerCase().includes("email") || res.error.toLowerCase().includes("user ")) setEmailInvalid(true);
            if(res.error.toLowerCase().includes("password")) setPasswordInvalid(true);
            showErrorToast({ description: res.error, toast, toastId, setToastId });
            setLoading(false);
            return
        }

        await new Promise((resolve) => setTimeout(resolve, 500)); // users love to see some feedback

        if(res?.data){
            showToast({ description: res.data.message, toast, toastId, setToastId });
            if(values) signIn(values, setEmailInvalid, setPasswordInvalid, showErrorToast, { toast, toastId, setToastId });
        }
        setLoading(false);
    };

    return (
        <AuthLayout
            title='Create Account'
            subtitle='Sign up to start tracking punch items with your PUNCH ID tape.'
            footer={
                <>
                    <Text className='text-sm' style={{ color: theme.colors.textSecondary }}>Already have an account?</Text>
                    <AuthLink label='Sign In' onPress={() => navigate("SignIn")} />
                </>
            }
        >
            <AuthInput
                label='Name'
                icon='user'
                placeholder='Your full name'
                autoCapitalize='words'
                value={name}
                onChangeText={(value) => {
                    setName(value);
                    clearInvalid();
                }}
            />
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
                placeholder='At least 8 characters'
                secure
                value={password}
                invalid={passwordInvalid}
                onChangeText={(value) => {
                    setPassword(value);
                    clearInvalid();
                }}
            />
            <AuthInput
                label='Confirm Password'
                icon='lock'
                placeholder='Re-enter your password'
                secure
                value={confirmPassword}
                invalid={passwordInvalid}
                onChangeText={(value) => {
                    setConfirmPassword(value);
                    clearInvalid();
                }}
            />
            <Text className='-mt-1 mb-4 text-xs leading-5' style={{ color: theme.colors.textMuted }}>
                Use 8+ characters with an uppercase letter, a lowercase letter, a number and a symbol (@$!%*?&).
            </Text>
            <AuthButton label='Create Account' onPress={handleSubmit} disabled={!canSignUp} loading={loading} />
        </AuthLayout>
    );
};

export default SignUp;
