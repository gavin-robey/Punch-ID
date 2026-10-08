import { theme } from '@/utils/theme';
import { FC, ReactNode, useEffect, useState } from 'react';
import { Image, Platform, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AntDesign } from '@react-native-vector-icons/ant-design';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Input, InputField } from '@/components/ui/input';
import { runAxiosAsync } from '@/api/runAxiosAsync';
import asyncStorage, { Keys } from '@/utils/asyncStorage';
import { yupValidate } from '@/utils/validator';
import useClient from '@/hooks/useClient';
import useJobs from '@/hooks/useJobs';
import { newTaskSchema } from '@/validation/job';
import { AppStackParamList } from '@/navigator/app/AppNavigator';
import JobSelect from '@/components/JobSelect';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { showErrorToast } from '@/components/ErrorToast';
import { showToast } from '@/components/Toast';

type ContentType = 'media' | 'notes' | 'attachment';
type PickedFile = { uri: string; name: string; mimeType?: string; size?: number; file?: File };
type Visibility = 'project' | 'template';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // cloudinary's single request upload limit

const CONTENT_TYPES: { type: ContentType; label: string; subtitle: string; icon: 'picture' | 'file-text' | 'paper-clip' }[] = [
    { type: 'media', label: 'Photo / Video', subtitle: 'From your camera roll', icon: 'picture' },
    { type: 'notes', label: 'Notes', subtitle: 'Add text notes', icon: 'file-text' },
    { type: 'attachment', label: 'Attachment', subtitle: 'Upload any file', icon: 'paper-clip' },
];

const VISIBILITY_OPTIONS: { value: Visibility; label: string; subtitle: string }[] = [
    { value: 'project', label: 'Project Only', subtitle: 'Only visible to project members' },
    { value: 'template', label: 'All Projects (Template Library)', subtitle: 'Make available as a template for all projects' },
];

const styles = {
    card: `mb-4 rounded-2xl border p-4`,
    stepTitle: `text-base font-extrabold uppercase tracking-wide`,
    stepSubtitle: `mb-3 mt-1 text-sm`,
    label: `mb-2 text-xs font-bold uppercase`,
    input: `rounded-xl border bg-transparent`,
    button: `flex-row items-center justify-center rounded-lg px-4 py-3.5`,
    buttonText: `text-base font-bold`,
};

const cardStyle = { backgroundColor: theme.colors.backgroundPrimary, borderColor: theme.colors.border };
const inputStyle = { borderColor: theme.colors.border };
const inputTextStyle = { color: theme.colors.textPrimary };

// due dates travel as YYYY-MM-DD strings (what the server validates), the pickers work with Date objects
const toDateString = (date: Date) => {
    const pad = (value: number) => `${value}`.padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const parseDateString = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return isNaN(date.getTime()) ? new Date() : date;
};

const defaultDueDate = () => toDateString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

const formatFileSize = (bytes?: number) => {
    if(!bytes) return '';
    if(bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const Step: FC<{ title: string; subtitle?: string; children: ReactNode }> = ({ title, subtitle, children }) => (
    <View className={styles.card} style={cardStyle}>
        <Text className={styles.stepTitle} style={{ color: theme.colors.textPrimary }}>{title}</Text>
        {subtitle ? <Text className={styles.stepSubtitle} style={{ color: theme.colors.textSecondary }}>{subtitle}</Text> : <View className='mb-3' />}
        {children}
    </View>
);

const ContentTypeCard: FC<{ label: string; subtitle: string; icon: 'picture' | 'file-text' | 'paper-clip'; selected: boolean; onPress: () => void }> = ({ label, subtitle, icon, selected, onPress }) => (
    <TouchableOpacity
        className='w-[31.5%] items-center rounded-xl border px-1 py-4'
        style={{ borderColor: selected ? theme.colors.primary : theme.colors.border, backgroundColor: selected ? theme.colors.primaryMuted : 'transparent' }}
        onPress={onPress}
    >
        {selected && (
            <View className='absolute right-1.5 top-1.5'>
                <AntDesign name='check-circle' size={16} color={theme.colors.primary} />
            </View>
        )}
        <AntDesign name={icon} size={30} color={selected ? theme.colors.primary : theme.colors.iconMuted} />
        <Text className='mt-2 text-sm font-bold' style={{ color: theme.colors.textPrimary }}>{label}</Text>
        <Text className='mt-0.5 text-center text-[11px]' style={{ color: theme.colors.textMuted }}>{subtitle}</Text>
    </TouchableOpacity>
);

const RadioOption: FC<{ label: string; subtitle: string; selected: boolean; onPress: () => void }> = ({ label, subtitle, selected, onPress }) => (
    <TouchableOpacity className='mb-3 flex-row' onPress={onPress}>
        <View className='mt-0.5 h-5 w-5 items-center justify-center rounded-full border-2' style={{ borderColor: selected ? theme.colors.primary : theme.colors.textMuted }}>
            {selected && <View className='h-2.5 w-2.5 rounded-full' style={{ backgroundColor: theme.colors.primary }} />}
        </View>
        <View className='ml-3 flex-1'>
            <Text className='text-sm font-bold' style={{ color: theme.colors.textPrimary }}>{label}</Text>
            <Text className='text-xs' style={{ color: theme.colors.textSecondary }}>{subtitle}</Text>
        </View>
    </TouchableOpacity>
);

const DueDatePicker: FC<{ value: string; onChange: (value: string) => void }> = ({ value, onChange }) => {
    const date = parseDateString(value);
    const label = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

    // the native picker has no web implementation, so web keeps a plain text field
    if(Platform.OS === 'web'){
        return (
            <Input className={styles.input} style={inputStyle}>
                <View className='pl-3'>
                    <AntDesign name='calendar' size={16} color={theme.colors.iconMuted} />
                </View>
                <InputField placeholder='YYYY-MM-DD' placeholderTextColor={theme.colors.textMuted} value={value} onChangeText={onChange} style={inputTextStyle} />
            </Input>
        );
    }

    if(Platform.OS === 'ios'){
        return (
            <View className='flex-row items-center rounded-xl border px-3 py-1.5' style={inputStyle}>
                <AntDesign name='calendar' size={16} color={theme.colors.iconMuted} />
                <Text className='ml-2 flex-1 text-sm' style={inputTextStyle}>{label}</Text>
                <DateTimePicker
                    value={date}
                    mode='date'
                    display='compact'
                    minimumDate={new Date()}
                    themeVariant='dark'
                    accentColor={theme.colors.primary}
                    onValueChange={(_, selected) => onChange(toDateString(selected))}
                />
            </View>
        );
    }

    return (
        <TouchableOpacity
            className='flex-row items-center rounded-xl border px-3 py-3'
            style={inputStyle}
            onPress={() => DateTimePickerAndroid.open({
                value: date,
                mode: 'date',
                minimumDate: new Date(),
                onValueChange: (_, selected) => onChange(toDateString(selected)),
            })}
        >
            <AntDesign name='calendar' size={16} color={theme.colors.iconMuted} />
            <Text className='ml-2 flex-1 text-sm' style={inputTextStyle}>{label}</Text>
            <AntDesign name='down' size={12} color={theme.colors.iconMuted} />
        </TouchableOpacity>
    );
};

const AddPunchItem: FC = () => {
    const { navigate, goBack } = useNavigation<NavigationProp<AppStackParamList>>();
    const { authClient } = useClient();
    const { currentJob, fetchJobs } = useJobs();
    const toast = useToast();
    const [toastId, setToastId] = useState(0);

    const [code, setCode] = useState('');
    const [contentType, setContentType] = useState<ContentType>('media');
    const [file, setFile] = useState<PickedFile | null>(null);
    const [notes, setNotes] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dateDue, setDateDue] = useState(defaultDueDate);
    const [visibility, setVisibility] = useState<Visibility>('project');
    const [loading, setLoading] = useState(false);

    const canSubmit = Boolean(
        currentJob &&
        code.trim() &&
        title.trim() &&
        (contentType === 'notes' ? notes.trim() : file) &&
        !loading
    );

    useEffect(() => {
        fetchJobs().then(({ error }) => {
            if(error) showErrorToast({ description: error, toast, toastId, setToastId });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const resetForm = () => {
        setCode('');
        setFile(null);
        setNotes('');
        setTitle('');
        setDescription('');
        setDateDue(defaultDueDate());
        setVisibility('project');
    };

    const handleContentType = (type: ContentType) => {
        setContentType(type);
        setFile(null);
    };

    // photos and videos come from the camera roll, attachments from the file system
    const handleBrowseFiles = async () => {
        let picked: PickedFile;

        if(contentType === 'media'){
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images', 'videos'],
                quality: 0.8,
            });
            if(result.canceled) return;

            const asset = result.assets[0];
            const isVideo = asset.type === 'video';
            picked = {
                uri: asset.uri,
                name: asset.fileName ?? `${isVideo ? 'video' : 'photo'}-${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`,
                mimeType: asset.mimeType ?? (isVideo ? 'video/mp4' : 'image/jpeg'),
                size: asset.fileSize,
                file: asset.file,
            };
        }else{
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });
            if(result.canceled) return;

            const asset = result.assets[0];
            picked = { uri: asset.uri, name: asset.name, mimeType: asset.mimeType, size: asset.size, file: asset.file };
        }

        if(picked.size && picked.size > MAX_FILE_SIZE){
            showErrorToast({ description: 'File must be 100MB or smaller', toast, toastId, setToastId });
            return;
        }
        setFile(picked);
    };

    const handleSubmit = async () => {
        setLoading(true);
        const { values, error } = await yupValidate(newTaskSchema, {
            id: currentJob?.id ?? '',
            punchId: code,
            contentType,
            notes,
            name: title,
            description,
            dateDue,
            visibility,
        });

        if(error || !values){
            showErrorToast({ description: error ?? 'Invalid punch item', toast, toastId, setToastId });
            setLoading(false);
            return
        }

        if(contentType !== 'notes' && !file){
            showErrorToast({ description: 'Choose a file to upload', toast, toastId, setToastId });
            setLoading(false);
            return
        }

        // sent as multipart so the server's fileParser can handle both notes and file uploads
        const formData = new FormData();
        formData.append('id', values.id);
        formData.append('name', values.name.trim());
        formData.append('dateDue', values.dateDue);
        formData.append('contentType', contentType);
        formData.append('visibility', visibility);
        if(description.trim()) formData.append('description', description.trim());
        if(contentType === 'notes') formData.append('notes', notes.trim());
        if(contentType !== 'notes' && file){
            // web returns a File object, native needs the { uri, name, type } shape
            formData.append('file', (file.file ?? { uri: file.uri, name: file.name, type: file.mimeType ?? 'application/octet-stream' }) as any);
        }

        const accessToken = await asyncStorage.get(Keys.AUTH_TOKEN);
        const res = await runAxiosAsync<{ message: string }>(
            authClient.post(`job/create-task/${encodeURIComponent(values.punchId.trim())}`, formData, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'multipart/form-data',
                }
            })
        );

        if(res.error){
            showErrorToast({ description: res.error, toast, toastId, setToastId });
            setLoading(false);
            return
        }

        if(res?.data){
            showToast({ description: res.data.message, toast, toastId, setToastId });
            resetForm();
        }
        setLoading(false);
    };

    const renderPreview = () => {
        if(contentType === 'notes' && notes.trim()){
            return <Text className='p-4 text-sm' style={{ color: theme.colors.textSecondary }} numberOfLines={4}>{notes}</Text>;
        }
        if(file?.mimeType?.startsWith('image')){
            return <Image source={{ uri: file.uri }} className='h-40 w-full rounded-xl' resizeMode='cover' />;
        }
        if(file){
            return (
                <View className='flex-row items-center p-4'>
                    <AntDesign name={file.mimeType?.startsWith('video') ? 'video-camera' : 'file'} size={28} color={theme.colors.primary} />
                    <View className='ml-3 flex-1'>
                        <Text className='text-sm font-semibold' style={{ color: theme.colors.textPrimary }} numberOfLines={1}>{file.name}</Text>
                        <Text className='text-xs' style={{ color: theme.colors.textMuted }}>{formatFileSize(file.size)}</Text>
                    </View>
                </View>
            );
        }
        return (
            <View className='h-24 items-center justify-center'>
                <AntDesign name={contentType === 'media' ? 'picture' : 'file'} size={32} color={theme.colors.textMuted} />
            </View>
        );
    };

    return (
        <View className='flex-1' style={{ backgroundColor: theme.colors.backgroundSecondary }}>
            <ScrollView className='px-4' showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }} keyboardShouldPersistTaps='handled'>
                <View className='mb-5 flex-row items-start justify-between'>
                    <View className='flex-1 pr-3'>
                        <Text className='text-3xl font-black uppercase' style={{ color: theme.colors.textPrimary }}>Attach QR</Text>
                        <View className='mt-1 h-1 w-12 rounded-full' style={{ backgroundColor: theme.colors.primary }} />
                        <Text className='mt-3 text-sm' style={{ color: theme.colors.textSecondary }}>Upload and manage content that will be linked to an Arrow QR Code.</Text>
                    </View>
                    <TouchableOpacity className='flex-row items-center rounded-lg border px-3 py-2' style={cardStyle} onPress={() => navigate('Home')}>
                        <AntDesign name='arrow-left' size={14} color={theme.colors.textPrimary} />
                        <Text className='ml-2 text-sm font-semibold' style={{ color: theme.colors.textPrimary }}>Home</Text>
                    </TouchableOpacity>
                </View>

                <Step title='1. Job Site' subtitle='Select the job site this punch item belongs to.'>
                    <JobSelect allowAdd />
                </Step>

                <Step title='2. Register QR' subtitle='Enter the Arrow QR Code you want to attach content to. (text input until scan is fully implemented)'>
                    <View className='flex-row items-center rounded-xl border px-3 py-2' style={inputStyle}>
                        <View className='h-11 w-11 items-center justify-center rounded-lg' style={{ backgroundColor: theme.colors.backgroundTertiary }}>
                            <AntDesign name='arrow-right' size={24} color={theme.colors.primary} />
                        </View>
                        <View className='ml-3 flex-1'>
                            {/* TODO: replace with the scanner once the Scan screen is built */}
                            <Input className='h-8 border-0 bg-transparent'>
                                <InputField
                                    className='px-0 font-bold'
                                    placeholder='Enter QR Code'
                                    placeholderTextColor={theme.colors.textSecondary}
                                    autoCapitalize='characters'
                                    value={code}
                                    onChangeText={setCode}
                                    style={inputTextStyle}
                                />
                            </Input>
                        </View>
                        <AntDesign name='qrcode' size={20} color={theme.colors.iconMuted} />
                    </View>
                </Step>

                <Step title='3. Content Type' subtitle='Choose what type of content you want to attach.'>
                    <View className='flex-row justify-between'>
                        {CONTENT_TYPES.map((item) => (
                            <ContentTypeCard key={item.type} {...item} selected={contentType === item.type} onPress={() => handleContentType(item.type)} />
                        ))}
                    </View>
                </Step>

                {contentType === 'notes' ? (
                    <Step title='4. Write Notes' subtitle='Add the task notes for whoever scans this code.'>
                        <Input className={`${styles.input} h-32`} style={inputStyle}>
                            <InputField
                                placeholder='e.g. Outlet cover cracked, replace with white decora cover'
                                placeholderTextColor={theme.colors.textMuted}
                                multiline
                                textAlignVertical='top'
                                className='py-3'
                                value={notes}
                                onChangeText={setNotes}
                                style={inputTextStyle}
                            />
                        </Input>
                    </Step>
                ) : (
                    <Step title='4. Upload File' subtitle={contentType === 'media' ? 'Choose a photo or video from your camera roll.' : 'Upload your file.'}>
                        <View className='items-center rounded-xl border-2 border-dashed px-4 py-6' style={inputStyle}>
                            <AntDesign name='cloud-upload' size={40} color={theme.colors.primary} />
                            <Text className='mt-2 text-sm font-bold' style={{ color: theme.colors.textPrimary }}>
                                {file ? file.name : contentType === 'media' ? 'Choose a photo or video' : 'Choose a file from your device'}
                            </Text>
                            <TouchableOpacity className='mt-4 rounded-lg px-6 py-3' style={{ backgroundColor: theme.colors.primary }} onPress={handleBrowseFiles}>
                                <Text className='text-sm font-bold' style={{ color: theme.colors.primaryForeground }}>{file ? 'Replace' : contentType === 'media' ? 'Open Camera Roll' : 'Browse Files'}</Text>
                            </TouchableOpacity>
                            <Text className='mt-3 text-xs' style={{ color: theme.colors.textMuted }}>
                                {contentType === 'media' ? 'Photos or videos up to 100MB' : 'Any file up to 100MB'}
                            </Text>
                        </View>
                    </Step>
                )}

                <Step title='5. Content Details' subtitle='Add a title and description for this content.'>
                    <Text className={styles.label} style={{ color: theme.colors.textSecondary }}>
                        Title <Text style={{ color: theme.colors.primary }}>*</Text>
                    </Text>
                    <Input className={`${styles.input} mb-4`} style={inputStyle}>
                        <InputField placeholder='Enter a descriptive title' placeholderTextColor={theme.colors.textMuted} value={title} onChangeText={setTitle} style={inputTextStyle} />
                    </Input>

                    <Text className={styles.label} style={{ color: theme.colors.textSecondary }}>Description (Optional)</Text>
                    <Input className={`${styles.input} mb-4 h-24`} style={inputStyle}>
                        <InputField
                            placeholder='Add a description (optional)'
                            placeholderTextColor={theme.colors.textMuted}
                            multiline
                            textAlignVertical='top'
                            className='py-3'
                            value={description}
                            onChangeText={setDescription}
                            style={inputTextStyle}
                        />
                    </Input>

                    <Text className={styles.label} style={{ color: theme.colors.textSecondary }}>
                        Due Date <Text style={{ color: theme.colors.primary }}>*</Text>
                    </Text>
                    <DueDatePicker value={dateDue} onChange={setDateDue} />
                </Step>

                <Step title='6. Preview (Optional)' subtitle={file || notes.trim() ? 'This is what will be attached.' : 'Upload complete to see a preview.'}>
                    <View className='overflow-hidden rounded-xl' style={{ backgroundColor: theme.colors.backgroundTertiary }}>
                        {renderPreview()}
                    </View>
                </Step>

                <Step title='7. Visibility' subtitle='Choose who can view this content.'>
                    {VISIBILITY_OPTIONS.map((option) => (
                        <RadioOption key={option.value} label={option.label} subtitle={option.subtitle} selected={visibility === option.value} onPress={() => setVisibility(option.value)} />
                    ))}
                    <View className='mt-1 flex-row rounded-xl border p-3' style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.backgroundTertiary }}>
                        <AntDesign name='info-circle' size={16} color={theme.colors.info} style={{ marginTop: 2 }} />
                        <Text className='ml-3 flex-1 text-xs leading-5' style={{ color: theme.colors.textSecondary }}>
                            This content will be linked to the selected QR item. Anyone who scans this QR code will be able to view it.
                        </Text>
                    </View>
                </Step>

                <View className='flex-row justify-end'>
                    <TouchableOpacity className={`${styles.button} mr-3 border`} style={{ borderColor: theme.colors.border }} onPress={goBack}>
                        <Text className={styles.buttonText} style={{ color: theme.colors.textPrimary }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`${styles.button} flex-1`}
                        style={{ backgroundColor: canSubmit ? theme.colors.primary : theme.colors.backgroundTertiary }}
                        disabled={!canSubmit}
                        onPress={handleSubmit}
                    >
                        {loading ? (
                            <Spinner size='small' color={theme.colors.primaryForeground} />
                        ) : (
                            <>
                                <AntDesign name='qrcode' size={18} color={canSubmit ? theme.colors.primaryForeground : theme.colors.textMuted} />
                                <Text className={`ml-2 ${styles.buttonText}`} style={{ color: canSubmit ? theme.colors.primaryForeground : theme.colors.textMuted }}>Attach to QR</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

        </View>
    );
};

export default AddPunchItem;
