'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { VolunteerList } from '@/components/ngo/volunteer/VolunteerList';
import { FiInfo } from 'react-icons/fi';

export default function VolunteersPage() {
    return (
        <ProtectedRoute type="ngo">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-theme-heart via-theme-paw to-primary-dark bg-clip-text text-transparent">
                        Volunteer Heroes
                    </h1>
                </div>

                {/* Info card */}
                <div className="card dark:bg-gradient-to-br dark:from-card-dark dark:to-card-dark/90 hover-lift">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                            <FiInfo className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <h2 className="text-lg font-medium text-foreground dark:text-foreground-dark">
                                Volunteer Management
                            </h2>
                            <p className="text-sm text-muted-foreground dark:text-foreground-dark/60">
                                Add, manage, and organize your rescue volunteer team. Once added,
                                volunteers will receive an email with login credentials for the
                                mobile app.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Volunteer List Component */}
                <VolunteerList />
            </div>
        </ProtectedRoute>
    );
}
