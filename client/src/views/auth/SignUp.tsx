import Header from '../../../components/Header';
import { showErrorToast } from '../../../components/ErrorToast';
import { showToast } from '../../../components/Toast';
import { Input, InputField, InputSlot } from '../../../components/ui/input';
import { Text } from '../../../components/ui/text';
import { FC, useState } from 'react';
import { KeyboardAvoidingView, TouchableOpacity, View, useColorScheme } from 'react-native';
import { Icon, MailIcon, LockIcon, AtSignIcon } from "../../../components/ui/icon";
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigator/auth/AuthNavigator';
import { newUserSchema } from '../../validation/auth';
import { yupValidate } from '@/utils/validator';
import { runAxiosAsync } from '@/api/runAxiosAsync';
import { useToast } from '../../../components/ui/toast';
import { Spinner } from '../../../components/ui/spinner';
import client from '../../api/client';
import useAuth from '@/hooks/useAuth';

const styles = {
    container: `flex-1 justify-center p-6 md:mx-auto md:w-full md:max-w-[520px] md:p-10 pt-15`,
    input: `mb-3.5 min-h-0 rounded-lg border px-3.5 py-3 md:min-h-12`,
    button: `items-center rounded-lg p-3.5 md:min-h-12 md:justify-center`,
    buttonText: `font-semibold text-white`,
    footer: `mt-auto flex-row justify-between p-2 md:mt-6 md:px-0`,
    link: `text-blue-600`,
};

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
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const canSignIn = Boolean(
        name.trim() &&
        email.trim() &&
        password.trim() &&
        confirmPassword.trim() &&
        !loading
    );
    const { signIn } = useAuth();

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
        <>
            <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
                <View className={`${styles.container} ${isDarkMode ? 'bg-gray-950' : 'bg-white'}`}>
                    <Header title='Sign Up' subtitle="Sign up using the forms below" isDarkMode={isDarkMode}/>
                    <View className='mt-auto mb-auto'>
                        <Text className='text-white'></Text>
                        <Input isInvalid={false}>
                            <InputSlot>
                                <Icon as={AtSignIcon} className={`${isDarkMode ? 'text-gray-500' :  'text-black'}`} size='md'/>
                            </InputSlot>
                            <InputField className={`${isDarkMode ? ' text-white' :  'text-black'}`} keyboardType="email-address" placeholder="Name" value={name} onChangeText={(value) => {
                                setName(value);
                                setEmailInvalid(false);
                                setPasswordInvalid(false);
                            }} />
                        </Input>
                        <Input isInvalid={emailInvalid}>
                            <InputSlot>
                                <Icon as={MailIcon} className={`${isDarkMode ? 'text-gray-500' :  'text-black'}`} size='md'/>
                            </InputSlot>
                            <InputField className={`${isDarkMode ? ' text-white' :  'text-black'}`} keyboardType="email-address" placeholder="Email" value={email} onChangeText={(value) => {
                                setEmail(value);
                                setEmailInvalid(false);
                                setPasswordInvalid(false);
                            }} />
                        </Input>
                        <Input isInvalid={passwordInvalid}>
                            <InputSlot>
                                <Icon as={LockIcon} className={`${isDarkMode ? ' text-gray-500' :  'text-black'}`} size='md'/>
                            </InputSlot>
                            <InputField className={`${isDarkMode ? ' text-white' :  'text-black'}`} secureTextEntry placeholder="Password"  value={password} onChangeText={(value) => {
                                setPassword(value);
                                setEmailInvalid(false);
                                setPasswordInvalid(false);
                            }} />
                        </Input>
                        <Input isInvalid={false} >
                            <InputSlot>
                                <Icon as={LockIcon} className={`${isDarkMode ? ' text-gray-500' :  'text-black'}`} size='md'/>
                            </InputSlot>
                            <InputField className={`${isDarkMode ? ' text-white' :  'text-black'}`} secureTextEntry placeholder="Confirm Password"  value={confirmPassword} onChangeText={(value) => {
                                setConfirmPassword(value);
                                setEmailInvalid(false);
                                setPasswordInvalid(false);
                            }} />
                        </Input>
                        
                    
                        <TouchableOpacity
                            className={`${styles.button} ${canSignIn ? 'bg-blue-600' : 'bg-gray-700'}`}
                            onPress={handleSubmit}
                            disabled={!canSignIn}
                        >
                            {loading ?  (<Spinner size="small" color="grey" />) : (<Text className={styles.buttonText}>Sign Up</Text>)}
                        </TouchableOpacity>
                    </View>
                    <View className={styles.footer}>
                        <TouchableOpacity onPress={() => navigate("SignIn")}>
                            <Text className={styles.link}>Sign In</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigate("ForgetPassword")}>
                            <Text className={styles.link}>Forgot password?</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </>
    );
};

export default SignUp;
