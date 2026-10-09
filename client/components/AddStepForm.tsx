import React, { FC, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { theme } from '@/utils/theme';
import { Input, InputField } from './ui/input';
import { Spinner } from './ui/spinner';

const styles = {
    label: `text-xs font-bold uppercase`,
    input: `rounded-xl border bg-transparent`,
    button: `flex-row items-center justify-center rounded-lg px-4 py-3`,
    buttonText: `text-sm font-bold`,
};

const inputStyle = { borderColor: theme.colors.border };
const inputTextStyle = { color: theme.colors.textPrimary };

interface Props {
    onCancel: () => void;
    // resolve true to clear the form for the next step, false to keep what was typed
    onSave: (step: { title: string; note: string }) => Promise<boolean> | boolean;
}

// inline form for one instruction step, used when creating a punch item and on the punch item screen
const AddStepForm: FC<Props> = ({ onCancel, onSave }) => {
    const [title, setTitle] = useState('');
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        const saved = await onSave({ title, note });
        setSaving(false);
        if(saved){
            setTitle('');
            setNote('');
        }
    };

    return (
        <View className='mt-3 rounded-xl border p-3' style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.backgroundTertiary }}>
            <Text className={`mb-2 ${styles.label}`} style={{ color: theme.colors.textSecondary }}>New Step</Text>
            <Input className={`${styles.input} mb-2`} style={inputStyle}>
                <InputField placeholder='Step title' placeholderTextColor={theme.colors.textMuted} value={title} onChangeText={setTitle} style={inputTextStyle} autoFocus />
            </Input>
            <Input className={styles.input} style={inputStyle}>
                <InputField placeholder='Details (optional)' placeholderTextColor={theme.colors.textMuted} value={note} onChangeText={setNote} style={inputTextStyle} />
            </Input>
            <View className='mt-3 flex-row justify-end'>
                <TouchableOpacity className={`${styles.button} mr-2 border`} style={{ borderColor: theme.colors.border }} onPress={onCancel}>
                    <Text className={styles.buttonText} style={{ color: theme.colors.textPrimary }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className={styles.button}
                    style={{ backgroundColor: title.trim() && !saving ? theme.colors.primary : theme.colors.backgroundSecondary }}
                    disabled={!title.trim() || saving}
                    onPress={handleSave}
                >
                    {saving ? <Spinner size='small' color={theme.colors.primaryForeground} /> : <Text className={styles.buttonText} style={{ color: title.trim() ? theme.colors.primaryForeground : theme.colors.textMuted }}>Add Step</Text>}
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default AddStepForm;
