
import { Users } from "lucide-react";
import { RecentEntityCard } from "./RecentEntityCard";

interface RecentUser {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface RecentUsersProps {
  users: RecentUser[];
}

export const RecentUsers = ({ users }: RecentUsersProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };
  
  return (
    <RecentEntityCard 
      title="Recent Users" 
      navigateTo="/admin/users"
      icon={<Users />}
      emptyMessage="No recent users"
    >
      <ul className="space-y-4">
        {users.map(user => (
          <li key={user._id} className="flex items-start gap-4 px-4">
            <div className="rounded-full bg-primary/10 p-2 mt-1">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Joined {formatDate(user.createdAt)}
              </p>
            </div>
          </li>
        ))}
        
        {users.length === 0 && (
          <li className="py-4 text-center text-muted-foreground">
            No recent users
          </li>
        )}
      </ul>
    </RecentEntityCard>
  );
};
