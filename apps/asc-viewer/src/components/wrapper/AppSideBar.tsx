import { File, Folder } from 'lucide-react';
import { THierarchyItem } from '../../stores/ascStore/types';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarTrigger
} from '../ui/sidebar';

interface AppSideBarProps {
  headerLabel: string;
  navigationHierarchy: THierarchyItem | undefined;
  onItemClick: (id: string) => void;
  selectedItemId?: string;
}

export const AppSideBar = (props: AppSideBarProps) => {
  const { navigationHierarchy, headerLabel, onItemClick, selectedItemId } = props;

  return (
    <div className="absolute">
      <SidebarTrigger className="absolute left-4 top-4 z-50 md:hidden" />
      <Sidebar variant="floating" className="p-4">
        <SidebarHeader className="p-4">
          <h2 className="text-xl font-bold text-sidebar-foreground">{headerLabel}</h2>
        </SidebarHeader>
        <SidebarContent>
          {navigationHierarchy && (
            <NavHierarchyGroup
              item={navigationHierarchy}
              onItemClick={onItemClick}
              selectedItemId={selectedItemId}
            />
          )}
        </SidebarContent>
      </Sidebar>
    </div>
  );
};

// Recursive component to render hierarchy items
const NavHierarchyGroup = ({
  item,
  depth = 0,
  onItemClick,
  selectedItemId
}: {
  item: THierarchyItem;
  onItemClick: (id: string) => void;
  depth?: number;
  selectedItemId: string | undefined;
}) => {
  // For top-level groups, render a SidebarGroup
  if (item.type === 'group' && depth === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>{item.label}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {item.children.map((child) => (
              <NavHierarchyGroup
                key={child.id}
                item={child}
                depth={depth + 1}
                onItemClick={onItemClick}
                selectedItemId={selectedItemId}
              />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  // For items, render a SidebarMenuItem
  if (item.type === 'item') {
    const Icon = File;
    return (
      <SidebarMenuItem
        onClick={() => {
          onItemClick(item.id);
        }}>
        <SidebarMenuButton asChild isActive={selectedItemId === item.id}>
          <div className="cursor-pointer">
            {Icon && <Icon className="h-5 w-5" />}
            <span>{item.label}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  // For nested groups, render a SidebarMenuItem with SidebarMenuSub
  if (item.type === 'group' && depth > 0) {
    const Icon = Folder;
    return (
      <SidebarMenuItem>
        <SidebarMenuButton>
          {Icon && <Icon className="h-5 w-5" />}
          <span>{item.label}</span>
        </SidebarMenuButton>
        <SidebarMenuSub>
          {item.children.map((child) => (
            <SidebarMenuSubItem key={child.id}>
              <NavHierarchyGroup
                key={child.id}
                item={child}
                depth={depth + 1}
                onItemClick={onItemClick}
                selectedItemId={selectedItemId}
              />
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </SidebarMenuItem>
    );
  }

  return null;
};
