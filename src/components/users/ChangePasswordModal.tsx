import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminChangePasswordDto } from '@/services/user.service';

interface ChangePasswordModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: number;
    userName: string;
    onSubmit: (userId: number, data: AdminChangePasswordDto) => Promise<void>;
    isLoading?: boolean;
}

export function ChangePasswordModal({
    open,
    onOpenChange,
    userId,
    userName,
    onSubmit,
    isLoading,
}: ChangePasswordModalProps) {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        try {
            await onSubmit(userId, { newPassword });
            setNewPassword('');
            setConfirmPassword('');
            onOpenChange(false);
        } catch (err) {
            // El error ya se maneja en el hook
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Cambiar contraseña de {userName}</DialogTitle>
                    <DialogDescription>
                        Ingresa la nueva contraseña y confirma para cambiarla
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">Nueva contraseña</Label>
                        <Input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirma la contraseña"
                            required
                        />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Cambiando...' : 'Cambiar contraseña'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}