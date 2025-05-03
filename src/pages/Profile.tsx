import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { DeleteAccountDialog } from "../components/DeleteAccountDialog";
const Profile = () => {
  const {
    user,
    logout,
    deleteAccount
  } = useAuth();
  const navigate = useNavigate();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.image || null);
  const [uploading, setUploading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  useEffect(() => {
    if (user) {
      setFullName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setAvatarUrl(user.image || null);
    }
  }, [user]);
  const getInitials = () => {
    if (!fullName) return user?.email?.substring(0, 1).toUpperCase() || "U";
    return fullName.split(" ").map(n => n[0]).join("").toUpperCase();
  };
  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      console.log('Starting avatar upload...');
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }
      const file = event.target.files[0];
      console.log('Selected file:', file.name, 'Size:', file.size, 'Type:', file.type);
      const fileExt = file.name.split(".").pop();
      const filePath = `${user?.id}/avatar.${fileExt}`;
      console.log('Upload path:', filePath);
      console.log('User ID:', user?.id);
      console.log('Storage bucket:', 'avatars');

      // Upload image to Supabase Storage
      const {
        error: uploadError,
        data
      } = await supabase.storage.from("avatars").upload(filePath, file, {
        upsert: true
      });
      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw uploadError;
      }
      console.log('Upload successful:', data);

      // Get public URL
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from("avatars").getPublicUrl(filePath);
      console.log('Generated public URL:', publicUrl);

      // Update user metadata with avatar URL
      const {
        error: updateError
      } = await supabase.auth.updateUser({
        data: {
          avatar_url: publicUrl
        }
      });
      if (updateError) {
        console.error('Metadata update error details:', updateError);
        throw updateError;
      }
      console.log('User metadata updated successfully');

      // Update profile in database
      if (!user?.id) throw new Error("User ID is required");
      const {
        error: profileError
      } = await supabase.from('profiles').update({
        avatar_url: publicUrl
      }).eq('user_id', user.id);
      if (profileError) {
        console.error('Profile update error details:', profileError);
        throw profileError;
      }
      console.log('Profile updated successfully');
      setAvatarUrl(publicUrl);
      toast.success("Avatar updated successfully");
    } catch (error: any) {
      console.error('Full error in uploadAvatar:', error);
      toast.error(`Error uploading avatar: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };
  const handleUpdateProfile = async () => {
    try {
      setLoading(true);

      // Split name into first and last name
      const [firstName, ...lastNameParts] = fullName.split(' ');
      const lastName = lastNameParts.join(' ');

      // Update user metadata
      const {
        error: updateError
      } = await supabase.auth.updateUser({
        data: {
          first_name: firstName,
          last_name: lastName || null,
          phone: phone
        }
      });
      if (updateError) throw updateError;

      // Update profile in database
      if (!user?.id) throw new Error("User ID is required");
      const {
        error: profileError
      } = await supabase.from('profiles').update({
        first_name: firstName,
        last_name: lastName || null
      }).eq('user_id', user.id);
      if (profileError) throw profileError;
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(`Error updating profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    try {
      setLoading(true);
      const {
        error
      } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      toast.success("Password updated successfully");
      setIsPasswordDialogOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(`Error changing password: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteAccount = async () => {
    try {
      setLoading(true);

      // Get the current session to ensure we're authenticated
      const {
        data: {
          session
        },
        error: sessionError
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Please log in again to delete your account');
      }

      // Call the delete_user_account function directly
      const {
        error: deleteError
      } = await supabase.rpc('delete_user_account');
      if (deleteError) {
        console.error('Error deleting account:', deleteError);
        throw new Error(deleteError.message);
      }
      await logout();
      toast.success("Account deleted successfully");
      navigate("/login");
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast.error(`Error deleting account: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  return <div className="container mx-auto max-w-4xl py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
            <div className="relative">
              <Avatar className="w-24 h-24 border-2 border-gray-200">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={fullName} /> : <AvatarFallback className="bg-hydro-blue text-xl text-white">
                    {getInitials()}
                  </AvatarFallback>}
              </Avatar>
              <label htmlFor="avatar-upload" className="absolute bottom-0 right-0">
                <div className={`bg-green-500 hover:bg-green-600 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
                  {uploading ? <span className="animate-spin text-white">...</span> : <Camera className="h-4 w-4 text-white" />}
                </div>
                <input id="avatar-upload" type="file" accept="image/*" onChange={uploadAvatar} className="hidden" disabled={uploading} />
              </label>
            </div>

            <div className="space-y-1 text-center md:text-left">
              <h3 className="text-2xl font-semibold">{fullName || "User"}</h3>
              <p className="text-gray-500">{email}</p>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Enter your full name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your.email@example.com" disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Your phone number" />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button onClick={handleUpdateProfile} className="bg-hydro-blue hover:bg-blue-700" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        
        
      </Card>

      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and a new password below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={loading} className="bg-hydro-blue hover:bg-blue-700">
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg border-destructive">
              <div>
                <h3 className="font-semibold">Delete Account</h3>
                <p className="text-sm text-gray-500">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                Delete Account
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <DeleteAccountDialog isOpen={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} onConfirm={handleDeleteAccount} />
    </div>;
};
export default Profile;