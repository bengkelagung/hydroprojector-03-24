
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User } from 'lucide-react';
import { toast } from 'sonner';

const Profile = () => {
  const { user, updateProfile, loading } = useAuth();
  const [fullName, setFullName] = useState(user?.profile?.full_name || user?.name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      await updateProfile({ full_name: fullName });
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-hydro-blue" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">User Profile</CardTitle>
          <CardDescription>
            View and update your profile information
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center mb-4">
              {user?.profile?.avatar_url ? (
                <img 
                  src={user.profile.avatar_url} 
                  alt={user.name} 
                  className="h-24 w-24 rounded-full object-cover" 
                />
              ) : (
                <User className="h-12 w-12 text-gray-400" />
              )}
            </div>
            <h3 className="text-lg font-medium">{user?.name}</h3>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
          </form>
        </CardContent>
        
        <CardFooter>
          <Button
            type="submit"
            onClick={handleSubmit}
            className="w-full bg-hydro-blue hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Profile'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Profile;
