import Header from '../../../components/Header';
import { Input, InputField, InputSlot } from '../../../components/ui/input';
import { Text } from '../../../components/ui/text';
import { FC, useState } from 'react';
import { KeyboardAvoidingView, TouchableOpacity, View, useColorScheme } from 'react-native';
import { Icon, MailIcon } from "../../../components/ui/icon"
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigator/auth/AuthNavigator';
import { yupValidate } from '@/utils/validator';
import { emailSchema } from '@/validation/auth';
import { showErrorToast } from '../../../components/ErrorToast';
import { useToast } from '../../../components/ui/toast';
import { Spinner } from '../../../components/ui/spinner';
import { runAxiosAsync } from '@/api/runAxiosAsync';
import client from '@/api/client';
import { showToast } from '../../../components/Toast';

const styles = {
    container: `flex-1 justify-center p-6 md:mx-auto md:w-full md:max-w-[520px] md:p-10 pt-15`,
    input: `mb-3.5 min-h-0 rounded-lg border px-3.5 py-3 md:min-h-12`,
    button: `items-center rounded-lg p-3.5 md:min-h-12 md:justify-center`,
    buttonText: `font-semibold text-white`,
    footer: `mt-auto flex-row justify-between p-2 md:mt-6 md:px-0`,
    link: `text-blue-600`,
};

const ForgetPassword: FC = () => {
    const { navigate } = useNavigation<NavigationProp<AuthStackParamList>>();
    const [email, setEmail] = useState('');
    const [ emailInvalid, setEmailInvalid] = useState(false);
    const [loading, setLoading] = useState(false);
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const canSignIn = Boolean(email.trim());
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
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
            <View className={`${styles.container} ${isDarkMode ? 'bg-gray-950' : 'bg-white'}`}>
                <Header title='Forgot Password?' subtitle='Send the password reset link below' isDarkMode={isDarkMode}/>

                <View className='mt-auto mb-auto'>
                    <Input isInvalid={emailInvalid} >
                        <InputSlot>
                            <Icon as={MailIcon} className={`${isDarkMode ? 'text-gray-500' :  'text-black'}`} size='md'/>
                        </InputSlot>
                        <InputField className={`${isDarkMode ? ' text-white' :  'text-black'}`} keyboardType="email-address" placeholder="Email" value={email} onChangeText={(value) => {
                            setEmailInvalid(false);
                            setEmail(value);
                        }} />
                    </Input>
        
                    <TouchableOpacity
                        className={`${styles.button} ${canSignIn ? 'bg-blue-600' : 'bg-gray-700'}`}
                        onPress={handleSubmit}
                        disabled={!canSignIn}
                    >
                        {loading ?  (<Spinner size="small" color="grey" />) : (<Text className={styles.buttonText}>Send Link</Text>)}
                    </TouchableOpacity>
                </View>
                <View className={styles.footer}>
                    <TouchableOpacity onPress={() => navigate("SignIn")}>
                        <Text className={styles.link}>Sign In</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigate("SignUp")}>
                        <Text className={styles.link}>Sign Up</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

export default ForgetPassword;