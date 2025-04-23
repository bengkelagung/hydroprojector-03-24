
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserRound, Mail, Calendar } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white shadow-lg">
          <CardHeader className="text-center border-b pb-8">
            <div className="w-32 h-32 mx-auto bg-hydro-blue rounded-full flex items-center justify-center mb-4">
              <UserRound className="w-20 h-20 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              {user?.name || 'User Profile'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="flex items-center space-x-4 px-4">
                <UserRound className="w-6 h-6 text-hydro-blue" />
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="text-lg font-medium text-gray-800">{user?.name}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 px-4">
                <Mail className="w-6 h-6 text-hydro-blue" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-lg font-medium text-gray-800">{user?.email}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 px-4">
                <Calendar className="w-6 h-6 text-hydro-blue" />
                <div>
                  <p className="text-sm text-gray-500">Join Date</p>
                  <p className="text-lg font-medium text-gray-800">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
