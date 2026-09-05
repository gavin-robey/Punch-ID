import Header from '../../../components/Header';
import { showErrorToast } from '../../../components/ErrorToast';
import { Input, InputField, InputSlot } from '../../../components/ui/input';
import { Text } from '../../../components/ui/text';
import { FC, useState } from 'react';
import { KeyboardAvoidingView, TouchableOpacity, View, useColorScheme } from 'react-native';
import { Icon, MailIcon, LockIcon } from "../../../components/ui/icon";
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigator/auth/AuthNavigator';
import { signInSchema } from '../../validation/auth';
import { yupValidate } from '@/utils/validator';
import { useToast } from '../../../components/ui/toast';
import { Spinner } from '../../../components/ui/spinner';
import useAuth from '@/hooks/useAuth';

const styles = {
    container: `flex-1 justify-center p-6 md:mx-auto md:w-full md:max-w-[520px] md:p-10 pt-15`,
    input: `mb-3.5 min-h-0 rounded-lg border px-3.5 py-3 md:min-h-12`,
    button: `items-center rounded-lg p-3.5 md:min-h-12 md:justify-center`,
    buttonText: `font-semibold text-white`,
    footer: `mt-auto flex-row justify-between p-2 md:mt-6 md:px-0`,
    link: `text-blue-600`,
};

const SignIn: FC = () => {
    const { navigate } = useNavigation<NavigationProp<AuthStackParamList>>();
    const [email, setEmail] = useState('');
    const toast = useToast();
    const [toastId, setToastId] = useState(0);
    const [password, setPassword] = useState('');
    const [emailInvalid, setEmailInvalid] = useState(false);
    const [passwordInvalid, setPasswordInvalid] = useState(false);
    const [loading, setLoading] = useState(false);
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const canSignIn = Boolean(email.trim() && password.trim() && !loading);
    const { signIn } = useAuth();

    const handleSubmit = async () => {
        const { values, error } = await yupValidate(signInSchema, { email, password,});

        if(error) {
            if(error.toLowerCase().includes("email")|| error.toLowerCase().includes("user")) setEmailInvalid(true);
            if(error.toLowerCase().includes("password")) setPasswordInvalid(true);
            showErrorToast({ description: error, toast, toastId, setToastId });
            setLoading(false);
            return
        }

        if(values) signIn(values, setEmailInvalid, setPasswordInvalid, showErrorToast, { toast, toastId, setToastId });
    };

    return (
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
            <View className={`${styles.container} ${isDarkMode ? 'bg-gray-950' : 'bg-white'}`}>
                <Header title='Login' subtitle='Please login using your email and password' isDarkMode={isDarkMode}/>

                <View className='mt-auto'>
                    <Input isInvalid={emailInvalid} >
                        <InputSlot>
                            <Icon as={MailIcon} className={`${isDarkMode ? 'text-gray-500' :  'text-black'}`} size='md'/>
                        </InputSlot>
                        <InputField autoCapitalize="none" className={`${isDarkMode ? ' text-white' :  'text-black'}`} keyboardType="email-address" placeholder="Email" value={email} onChangeText={(value) => {
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

                    <TouchableOpacity
                        className={`${styles.button} ${canSignIn ? 'bg-blue-600' : 'bg-gray-700'}`}
                        onPress={handleSubmit}
                        disabled={!canSignIn}
                    >
                        {loading ?  (<Spinner size="small" color="grey" />) : (<Text className={styles.buttonText}>Sign In</Text>)}
                    </TouchableOpacity>
                </View>

                <View className={styles.footer}>
                    <TouchableOpacity onPress={() => navigate("SignUp")}>
                        <Text className={styles.link}>Sign Up</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigate("ForgetPassword")}>
                        <Text className={styles.link}>Forgot password?</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

export default SignIn;
