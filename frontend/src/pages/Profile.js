import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { User, Mail, Calendar, Save, Edit3, Sun, Moon } from 'lucide-react';

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const { theme, setThemeMode } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Check if user is a demo user
  const isDemoUser = useMemo(() => {
    if (!user) return false;
    
    // Check for specific demo user
    return (
      user.id === 1 ||
      user.email === 'demo@todoapp.com' ||
      user.username === 'demo' ||
      user.is_demo === true // If backend provides this flag
    );
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    
    try {
      const result = await updateProfile(formData);
      if (result.success) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Profile update error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
    });
    setIsEditing(false);
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChangePassword = async () => {
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('New password must be at least 6 characters long');
      return;
    }

    setIsChangingPassword(true);
    
    try {
      const result = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      if (result.success) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setShowChangePassword(false);
      }
    } catch (error) {
      console.error('Password change error:', error);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setShowChangePassword(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Profile</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
            {isDemoUser && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Demo Account
                    </h3>
                    <div className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                      <p>This is a demo account. All profile settings, security options, and preferences are disabled.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>
                    Update your personal information and account details
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2"
                  disabled={isDemoUser}
                  title={isDemoUser ? "Profile editing is disabled for demo users" : ""}
                >
                  {isEditing ? (
                    <>
                      <Edit3 className="h-4 w-4" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-4">
                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {user?.username}
                  </h3>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <Input
                  label="Username"
                  value={formData.username}
                  onChange={handleInputChange}
                  name="username"
                  leftIcon={<User className="h-4 w-4" />}
                  disabled={!isEditing || isDemoUser}
                  helperText={isDemoUser ? "Username cannot be changed for demo users" : "This will be visible to other users"}
                />
                
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  name="email"
                  leftIcon={<Mail className="h-4 w-4" />}
                  disabled={!isEditing || isDemoUser}
                  helperText={isDemoUser ? "Email cannot be changed for demo users" : "We'll use this email to contact you"}
                />
              </div>

              {/* Account Details */}
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-medium text-foreground mb-3">Account Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Member since:</span>
                    <span className="text-foreground">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">User ID:</span>
                    <span className="text-foreground font-mono text-xs">
                      {user?.id || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex justify-end space-x-2 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSubmitting}
                    loading={isSubmitting}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Settings */}
          <div className="mt-8 space-y-6">
            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>
                  Manage your account security settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-foreground">Password</h4>
                        <p className="text-sm text-muted-foreground">
                          {isDemoUser ? "Password changes are disabled for demo users" : "Last updated: Never"}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={isDemoUser}
                        onClick={() => setShowChangePassword(!showChangePassword)}
                        title={isDemoUser ? "Password changes are disabled for demo users" : ""}
                      >
                        {showChangePassword ? 'Cancel' : 'Change Password'}
                      </Button>
                    </div>
                    
                    {showChangePassword && !isDemoUser && (
                      <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <label htmlFor="currentPassword" className="block text-sm font-medium text-foreground mb-2">
                            Current Password
                          </label>
                          <Input
                            id="currentPassword"
                            name="currentPassword"
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordInputChange}
                            placeholder="Enter current password"
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="newPassword" className="block text-sm font-medium text-foreground mb-2">
                            New Password
                          </label>
                          <Input
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={handlePasswordInputChange}
                            placeholder="Enter new password"
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                            Confirm New Password
                          </label>
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordInputChange}
                            placeholder="Confirm new password"
                            className="w-full"
                          />
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={handleChangePassword}
                            disabled={isChangingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                            className="flex-1"
                          >
                            {isChangingPassword ? 'Changing...' : 'Change Password'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleCancelPasswordChange}
                            disabled={isChangingPassword}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <h4 className="font-medium text-foreground">Two-Factor Authentication</h4>
                      <p className="text-sm text-muted-foreground">
                        {isDemoUser ? "2FA setup is disabled for demo users" : "Add an extra layer of security to your account"}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={isDemoUser}
                      title={isDemoUser ? "2FA setup is disabled for demo users" : ""}
                    >
                      Enable 2FA
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>
                  Customize your application experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <h4 className="font-medium text-foreground">Theme</h4>
                      <p className="text-sm text-muted-foreground">
                        {isDemoUser ? "Theme changes are disabled for demo users" : "Choose your preferred theme"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={theme === 'light' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => !isDemoUser && setThemeMode('light')}
                        disabled={isDemoUser}
                        title={isDemoUser ? "Theme changes are disabled for demo users" : "Switch to light theme"}
                        className="flex items-center gap-2"
                      >
                        <Sun className="h-4 w-4" />
                        Light
                      </Button>
                      <Button
                        variant={theme === 'dark' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => !isDemoUser && setThemeMode('dark')}
                        disabled={isDemoUser}
                        title={isDemoUser ? "Theme changes are disabled for demo users" : "Switch to dark theme"}
                        className="flex items-center gap-2"
                      >
                        <Moon className="h-4 w-4" />
                        Dark
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <h4 className="font-medium text-foreground">Email Notifications</h4>
                      <p className="text-sm text-muted-foreground">
                        {isDemoUser ? "Email notifications are disabled for demo users" : "Receive email updates about your todos"}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={isDemoUser}
                      title={isDemoUser ? "Email notifications are disabled for demo users" : ""}
                    >
                      Configure
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <h4 className="font-medium text-foreground">Data Export</h4>
                      <p className="text-sm text-muted-foreground">
                        {isDemoUser ? "Data export is disabled for demo users" : "Download your todos and account data"}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={isDemoUser}
                      title={isDemoUser ? "Data export is disabled for demo users" : ""}
                    >
                      Export Data
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
