import React, { FC, useState } from 'react';
import { KeyboardAvoidingView, Modal, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AntDesign } from '@react-native-vector-icons/ant-design';
import { theme } from '@/utils/theme';
import { yupValidate } from '@/utils/validator';
import { newJobSchema } from '@/validation/job';
import useJobs from '@/hooks/useJobs';
import { showErrorToast } from './ErrorToast';
import { showToast } from './Toast';
import { ChevronDownIcon } from './ui/icon';
import { Input, InputField } from './ui/input';
import { Spinner } from './ui/spinner';
import { useToast } from './ui/toast';
import { Select, SelectTrigger, SelectPortal, SelectContent, SelectItem, SelectDragIndicator, SelectDragIndicatorWrapper, SelectIcon, SelectInput, SelectBackdrop, SelectScrollView } from './ui/select';

const NEW_JOB = '__new_job__';

const styles = {
    title: `text-base font-extrabold uppercase tracking-wide`,
    subtitle: `mb-3 mt-1 text-sm`,
    label: `mb-2 text-xs font-bold uppercase`,
    button: `flex-row items-center justify-center rounded-lg px-4 py-3.5`,
    buttonText: `text-base font-bold`,
};

const NewJobModal: FC<{ visible: boolean; onClose: () => void; onCreate: (name: string) => Promise<boolean> }> = ({ visible, onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        setLoading(true);
        const created = await onCreate(name);
        setLoading(false);
        if(created){
            setName('');
            onClose();
        }
    };

    return (
        <Modal visible={visible} transparent animationType='fade' onRequestClose={onClose}>
            <KeyboardAvoidingView behavior='padding' className='flex-1 justify-center px-6' style={{ backgroundColor: theme.colors.overlay }}>
                <View className='rounded-2xl border p-5' style={{ backgroundColor: theme.colors.backgroundPrimary, borderColor: theme.colors.border }}>
                    <Text className={styles.title} style={{ color: theme.colors.textPrimary }}>New Job Site</Text>
                    <Text className={styles.subtitle} style={{ color: theme.colors.textSecondary }}>Punch items you attach will be grouped under this job.</Text>
                    <Text className={styles.label} style={{ color: theme.colors.textSecondary }}>Job Name</Text>
                    <Input className='rounded-xl border bg-transparent' style={{ borderColor: theme.colors.border }}>
                        <InputField
                            placeholder='e.g. Riverside Apartments – Building A'
                            placeholderTextColor={theme.colors.textMuted}
                            value={name}
                            onChangeText={setName}
                            style={{ color: theme.colors.textPrimary }}
                            autoFocus
                        />
                    </Input>
                    <View className='mt-5 flex-row justify-end'>
                        <TouchableOpacity className={`${styles.button} mr-3 border`} style={{ borderColor: theme.colors.border }} onPress={onClose}>
                            <Text className={styles.buttonText} style={{ color: theme.colors.textPrimary }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className={styles.button}
                            style={{ backgroundColor: name.trim() && !loading ? theme.colors.primary : theme.colors.backgroundTertiary }}
                            disabled={!name.trim() || loading}
                            onPress={handleCreate}
                        >
                            {loading ? <Spinner size='small' color={theme.colors.primaryForeground} /> : <Text className={styles.buttonText} style={{ color: theme.colors.primaryForeground }}>Create Job</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

interface Props {
    // adds a "+ Add New Job Site" option that opens the new job modal
    allowAdd?: boolean;
}

// job site picker bound to the jobs store, selecting or creating a job updates currentJob for the whole app
const JobSelect: FC<Props> = ({ allowAdd = false }) => {
    const { jobs, currentJob, pending, selectJob, createJob } = useJobs();
    const [modalOpen, setModalOpen] = useState(false);
    const insets = useSafeAreaInsets();
    const toast = useToast();
    const [toastId, setToastId] = useState(0);

    const handleCreateJob = async (name: string) => {
        const { values, error } = await yupValidate(newJobSchema, { name });
        if(error || !values){
            showErrorToast({ description: error ?? 'Invalid job name', toast, toastId, setToastId });
            return false;
        }

        const res = await createJob(values.name.trim());
        if(res.error){
            showErrorToast({ description: res.error, toast, toastId, setToastId });
            return false;
        }

        if(res.message) showToast({ description: res.message, toast, toastId, setToastId });
        return true;
    };

    if(pending && !jobs) return <Spinner size='small' color={theme.colors.primary} />;

    return (
        <>
            <Select
                key={currentJob?.id ?? 'none'}
                selectedValue={currentJob?.id ?? null}
                initialLabel={currentJob?.name}
                onValueChange={(value) => {
                    if(value === NEW_JOB) return setModalOpen(true);
                    selectJob(jobs?.find((job) => job.id === value) ?? null);
                }}
            >
                <SelectTrigger className='rounded-xl' style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.backgroundPrimary }} variant='outline' size='xl'>
                    <View className='pl-3'>
                        <AntDesign name='environment' size={18} color={theme.colors.primary} />
                    </View>
                    <SelectInput
                        placeholder={jobs?.length ? 'Select a job site' : allowAdd ? 'Create your first job site' : 'No job sites yet'}
                        placeholderTextColor={theme.colors.textMuted}
                        className='flex-1'
                        style={{ color: theme.colors.textPrimary }}
                    />
                    <SelectIcon className='mr-3' style={{ color: theme.colors.textSecondary }} as={ChevronDownIcon} />
                </SelectTrigger>
                <SelectPortal>
                    <SelectBackdrop style={{ backgroundColor: theme.colors.overlay }} />
                    {/* inline styles override gluestack's default tokens so the sheet matches the app theme */}
                    <SelectContent
                        style={{
                            backgroundColor: theme.colors.backgroundPrimary,
                            borderColor: theme.colors.border,
                            borderTopWidth: 1,
                            paddingHorizontal: 16,
                            // keeps the last option clear of the home indicator / gesture bar
                            paddingBottom: insets.bottom + 24,
                        }}
                    >
                        <SelectDragIndicatorWrapper style={{ paddingVertical: 8 }}>
                            <SelectDragIndicator style={{ backgroundColor: theme.colors.textMuted }} />
                        </SelectDragIndicatorWrapper>
                        <Text className='mb-2 w-full text-sm font-extrabold uppercase tracking-wide' style={{ color: theme.colors.textSecondary }}>Job Sites</Text>
                        <SelectScrollView style={{ maxHeight: 360 }}>
                            {jobs?.map((job) => {
                                const selected = job.id === currentJob?.id;
                                return (
                                    <SelectItem
                                        key={job.id}
                                        label={job.name}
                                        value={job.id}
                                        style={{ backgroundColor: selected ? theme.colors.primaryMuted : 'transparent', borderRadius: 12, paddingVertical: 14, marginBottom: 4 }}
                                        textStyle={{ style: { color: selected ? theme.colors.primary : theme.colors.textPrimary, fontSize: 16, fontWeight: selected ? '700' : '400' } }}
                                    />
                                );
                            })}
                        </SelectScrollView>
                        {allowAdd && (
                            <SelectItem
                                label='+ Add New Job Site'
                                value={NEW_JOB}
                                style={{ backgroundColor: 'transparent', borderTopWidth: 1, borderColor: theme.colors.border, marginTop: 4, paddingVertical: 16 }}
                                textStyle={{ style: { color: theme.colors.primary, fontSize: 16, fontWeight: '700' } }}
                            />
                        )}
                    </SelectContent>
                </SelectPortal>
            </Select>

            {allowAdd && <NewJobModal visible={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreateJob} />}
        </>
    );
};

export default JobSelect;
