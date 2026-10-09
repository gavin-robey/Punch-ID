import { FC, useEffect, useState } from 'react';
import { Image, Modal, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { AntDesign } from '@react-native-vector-icons/ant-design';
import { theme } from '@/utils/theme';
import { getAuthState, updateAuthState } from '@/store/auth';
import { runAxiosAsync } from '@/api/runAxiosAsync';
import asyncStorage, { Keys } from '@/utils/asyncStorage';
import useClient from '@/hooks/useClient';
import { Jobs } from '@/store/jobs';
import useAuth from '@/hooks/useAuth';
import useJobs from '@/hooks/useJobs';
import { showErrorToast } from '@/components/ErrorToast';
import { showToast } from '@/components/Toast';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';

const styles = {
    card: `mb-4 rounded-2xl border p-4`,
    sectionTitle: `text-base font-extrabold uppercase tracking-wide`,
    label: `text-xs font-bold uppercase`,
    button: `flex-row items-center justify-center rounded-lg px-4 py-3.5`,
    buttonText: `text-base font-bold`,
    divider: `h-px w-full`,
};

const cardStyle = { backgroundColor: theme.colors.backgroundPrimary, borderColor: theme.colors.border };

const DetailRow: FC<{ icon: 'user' | 'mail'; label: string; value: string }> = ({ icon, label, value }) => (
    <View className='flex-row items-center py-3'>
        <View className='h-10 w-10 items-center justify-center rounded-lg' style={{ backgroundColor: theme.colors.backgroundTertiary }}>
            <AntDesign name={icon} size={18} color={theme.colors.primary} />
        </View>
        <View className='ml-3 flex-1'>
            <Text className={styles.label} style={{ color: theme.colors.textMuted }}>{label}</Text>
            <Text className='mt-0.5 text-base' style={{ color: theme.colors.textPrimary }} numberOfLines={1}>{value}</Text>
        </View>
    </View>
);

const JobRow: FC<{ job: Jobs; isCurrent: boolean; isLast: boolean; onPress: () => void }> = ({ job, isCurrent, isLast, onPress }) => (
    <>
        <TouchableOpacity className='flex-row items-center py-3' onPress={onPress}>
            <View className='h-10 w-10 items-center justify-center rounded-lg' style={{ backgroundColor: isCurrent ? theme.colors.primaryMuted : theme.colors.backgroundTertiary }}>
                <AntDesign name='environment' size={18} color={isCurrent ? theme.colors.primary : theme.colors.iconMuted} />
            </View>
            <View className='ml-3 flex-1'>
                <Text className='text-base font-semibold' style={{ color: theme.colors.textPrimary }} numberOfLines={1}>{job.name}</Text>
                <Text className='text-xs' style={{ color: theme.colors.textMuted }}>
                    {job.punchTasks.length} punch {job.punchTasks.length === 1 ? 'item' : 'items'}
                </Text>
            </View>
            {isCurrent ? (
                <View className='rounded-md px-2.5 py-1' style={{ backgroundColor: theme.colors.primaryMuted }}>
                    <Text className='text-xs font-semibold' style={{ color: theme.colors.primary }}>Current</Text>
                </View>
            ) : (
                <AntDesign name='right' size={14} color={theme.colors.iconMuted} />
            )}
        </TouchableOpacity>
        {!isLast && <View className={styles.divider} style={{ backgroundColor: theme.colors.border }} />}
    </>
);

const SignOutModal: FC<{ visible: boolean; loading: boolean; onClose: () => void; onConfirm: () => void }> = ({ visible, loading, onClose, onConfirm }) => (
    <Modal visible={visible} transparent animationType='fade' onRequestClose={onClose}>
        <View className='flex-1 justify-center px-6' style={{ backgroundColor: theme.colors.overlay }}>
            <View className='rounded-2xl border p-5' style={cardStyle}>
                <Text className={styles.sectionTitle} style={{ color: theme.colors.textPrimary }}>Log Out</Text>
                <Text className='mt-2 text-sm' style={{ color: theme.colors.textSecondary }}>Are you sure you want to log out of PUNCH ID?</Text>
                <View className='mt-5 flex-row justify-end'>
                    <TouchableOpacity className={`${styles.button} mr-3 border`} style={{ borderColor: theme.colors.border }} onPress={onClose} disabled={loading}>
                        <Text className={styles.buttonText} style={{ color: theme.colors.textPrimary }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className={styles.button} style={{ backgroundColor: theme.colors.primary }} onPress={onConfirm} disabled={loading}>
                        {loading ? <Spinner size='small' color={theme.colors.primaryForeground} /> : <Text className={styles.buttonText} style={{ color: theme.colors.primaryForeground }}>Log Out</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    </Modal>
);

const Profile: FC = () => {
    const { profile } = useSelector(getAuthState);
    const { jobs, currentJob, pending, fetchJobs, selectJob } = useJobs();
    const { signOut } = useAuth();
    const { authClient } = useClient();
    const dispatch = useDispatch();
    const [uploading, setUploading] = useState(false);
    const toast = useToast();
    const [toastId, setToastId] = useState(0);
    const [loading, setLoading] = useState(false);
    const [signOutOpen, setSignOutOpen] = useState(false);
    const [signingOut, setSigningOut] = useState(false);

    const name = profile?.name ?? '';
    const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

    useEffect(() => {
        if(jobs) return;
        fetchJobs().then(({ error }) => {
            if(error) showErrorToast({ description: error, toast, toastId, setToastId });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleRefresh = async () => {
        setLoading(true);
        const { error } = await fetchJobs();
        if(error) showErrorToast({ description: error, toast, toastId, setToastId });
        setLoading(false);
    };

    // picks a square photo from the camera roll and uploads it through auth/update-avatar
    const handleAvatar = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if(result.canceled || !profile) return;

        setUploading(true);
        const asset = result.assets[0];
        const formData = new FormData();
        // web returns a File object, native needs the { uri, name, type } shape
        formData.append('avatar', (asset.file ?? { uri: asset.uri, name: asset.fileName ?? `avatar-${Date.now()}.jpg`, type: asset.mimeType ?? 'image/jpeg' }) as any);

        const accessToken = await asyncStorage.get(Keys.AUTH_TOKEN);
        const res = await runAxiosAsync<{ profile: { avatar: string } }>(
            authClient.patch('auth/update-avatar', formData, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'multipart/form-data',
                }
            })
        );

        if(res.error){
            showErrorToast({ description: res.error, toast, toastId, setToastId });
            setUploading(false);
            return
        }

        if(res?.data){
            dispatch(updateAuthState({ profile: { ...profile, avatar: res.data.profile.avatar }, pending: false }));
            showToast({ description: 'Profile photo updated', toast, toastId, setToastId });
        }
        setUploading(false);
    };

    // the navigator swaps to the auth screens once the profile is cleared, so there's nothing to reset after
    const handleSignOut = async () => {
        setSigningOut(true);
        await signOut();
    };

    return (
        <View className='flex-1' style={{ backgroundColor: theme.colors.backgroundSecondary }}>
            <ScrollView
                className='px-4'
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor={theme.colors.primary} />}
            >
                <View className='mb-5'>
                    <Text className='text-3xl font-black uppercase' style={{ color: theme.colors.textPrimary }}>Profile</Text>
                    <View className='mt-1 h-1 w-12 rounded-full' style={{ backgroundColor: theme.colors.primary }} />
                    <Text className='mt-3 text-sm' style={{ color: theme.colors.textSecondary }}>Manage your account and the job sites you work on.</Text>
                </View>

                <View className={`${styles.card} items-center py-6`} style={cardStyle}>
                    <TouchableOpacity onPress={handleAvatar} disabled={uploading}>
                        <View className='h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2' style={{ backgroundColor: theme.colors.backgroundTertiary, borderColor: theme.colors.primary }}>
                            {uploading ? (
                                <Spinner size='small' color={theme.colors.primary} />
                            ) : profile?.avatar ? (
                                <Image source={{ uri: profile.avatar }} className='h-full w-full' />
                            ) : (
                                <Text className='text-3xl font-black' style={{ color: theme.colors.textPrimary }}>{initials}</Text>
                            )}
                        </View>
                        <View className='absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full border-2' style={{ backgroundColor: theme.colors.primary, borderColor: theme.colors.backgroundPrimary }}>
                            <AntDesign name='camera' size={14} color={theme.colors.primaryForeground} />
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity className='mt-2' onPress={handleAvatar} disabled={uploading}>
                        <Text className='text-sm font-semibold' style={{ color: theme.colors.primary }}>{profile?.avatar ? 'Change Photo' : 'Add Photo'}</Text>
                    </TouchableOpacity>
                    <Text className='mt-3 text-2xl font-extrabold' style={{ color: theme.colors.textPrimary }} numberOfLines={1}>{name}</Text>
                    <Text className='mt-1 text-sm' style={{ color: theme.colors.textSecondary }} numberOfLines={1}>{profile?.email}</Text>
                    <View
                        className='mt-3 flex-row items-center rounded-md px-2.5 py-1'
                        style={{ backgroundColor: profile?.verified ? theme.colors.successMuted : theme.colors.warningMuted }}
                    >
                        <AntDesign
                            name={profile?.verified ? 'safety-certificate' : 'exclamation-circle'}
                            size={12}
                            color={profile?.verified ? theme.colors.success : theme.colors.warning}
                        />
                        <Text className='ml-1.5 text-xs font-semibold' style={{ color: profile?.verified ? theme.colors.success : theme.colors.warning }}>
                            {profile?.verified ? 'Verified' : 'Email not verified'}
                        </Text>
                    </View>
                </View>

                <View className={styles.card} style={cardStyle}>
                    <Text className={`mb-1 ${styles.sectionTitle}`} style={{ color: theme.colors.textPrimary }}>Account Details</Text>
                    <DetailRow icon='user' label='Name' value={name} />
                    <View className={styles.divider} style={{ backgroundColor: theme.colors.border }} />
                    <DetailRow icon='mail' label='Email' value={profile?.email ?? ''} />
                </View>

                <View className={styles.card} style={cardStyle}>
                    <View className='mb-1 flex-row items-center justify-between'>
                        <Text className={styles.sectionTitle} style={{ color: theme.colors.textPrimary }}>Job Sites</Text>
                        <Text className='text-sm font-semibold' style={{ color: theme.colors.textMuted }}>{jobs?.length ?? 0}</Text>
                    </View>
                    {pending && !jobs ? (
                        <View className='py-4'>
                            <Spinner size='small' color={theme.colors.primary} />
                        </View>
                    ) : jobs?.length ? (
                        jobs.map((job, index) => (
                            <JobRow key={job.id} job={job} isCurrent={job.id === currentJob?.id} isLast={index === jobs.length - 1} onPress={() => selectJob(job)} />
                        ))
                    ) : (
                        <Text className='py-4 text-center text-sm' style={{ color: theme.colors.textMuted }}>You aren&apos;t on any job sites yet.</Text>
                    )}
                </View>

                <TouchableOpacity className={`${styles.button} mt-2 border`} style={{ borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryMuted }} onPress={() => setSignOutOpen(true)}>
                    <AntDesign name='logout' size={18} color={theme.colors.primary} />
                    <Text className={`ml-2 ${styles.buttonText}`} style={{ color: theme.colors.primary }}>Log Out</Text>
                </TouchableOpacity>

                <Text className='mt-6 text-center text-xs' style={{ color: theme.colors.textMuted }}>© {new Date().getFullYear()} PUNCH ID. All rights reserved.</Text>
            </ScrollView>

            <SignOutModal visible={signOutOpen} loading={signingOut} onClose={() => setSignOutOpen(false)} onConfirm={handleSignOut} />
        </View>
    );
};

export default Profile;
