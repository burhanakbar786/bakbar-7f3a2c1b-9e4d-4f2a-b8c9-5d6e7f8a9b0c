import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TaskService } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ITask, TaskStatus, TaskPriority } from '@turbovets/data';
import { TaskEditorComponent } from '../../task-editor/logic/task-editor.component';
import { NotificationComponent } from '../../../shared/notification/logic/notification.component';

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, TaskEditorComponent, NotificationComponent],
  templateUrl: '../template/task-board.component.html',
  styleUrls: ['../styles/task-board.component.css'],
  animations: [
    trigger('taskAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-30px) scale(0.9)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0) scale(1)' }))
      ]),
      transition(':leave', [
        animate('250ms ease-in', style({ opacity: 0, transform: 'translateX(30px) scale(0.9)' }))
      ])
    ])
  ]
})
export class TaskBoardComponent implements OnInit {
  tasks: ITask[] = [];
  filteredTasks: ITask[] = [];
  currentUser: any;
  darkMode = false;
  showTaskModal = false;
  selectedTask: ITask | null = null;

  // Filters
  searchQuery = '';
  selectedCategory = '';
  selectedPriority = '';
  categories: string[] = ['Work', 'Personal', 'Urgent', 'Meeting'];
  priorities = Object.values(TaskPriority);

  // Task columns for drag and drop
  todoTasks: ITask[] = [];
  inProgressTasks: ITask[] = [];
  doneTasks: ITask[] = [];

  TaskStatus = TaskStatus;
  TaskPriority = TaskPriority;

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private notificationService: NotificationService,
  ) {
    this.loadDarkMode();
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadTasks();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'n' && !event.ctrlKey && !event.metaKey) {
      const target = event.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && this.canCreateTask()) {
        this.openNewTaskModal();
      }
    }
    if (event.key === 'Escape') {
      this.closeTaskModal();
    }
  }

  loadTasks(): void {
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.applyFilters();
        this.organizeTasks();
      },
      error: () => {
        this.notificationService.error('Failed to load tasks');
      },
    });
  }

  applyFilters(): void {
    this.filteredTasks = this.tasks.filter((task) => {
      const matchesSearch =
        !this.searchQuery ||
        task.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesCategory = !this.selectedCategory || task.category === this.selectedCategory;
      const matchesPriority = !this.selectedPriority || task.priority === this.selectedPriority;

      return matchesSearch && matchesCategory && matchesPriority;
    });

    this.organizeTasks();
  }

  organizeTasks(): void {
    this.todoTasks = this.filteredTasks
      .filter((t) => t.status === TaskStatus.TODO)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    this.inProgressTasks = this.filteredTasks
      .filter((t) => t.status === TaskStatus.IN_PROGRESS)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    this.doneTasks = this.filteredTasks
      .filter((t) => t.status === TaskStatus.DONE)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  drop(event: CdkDragDrop<ITask[]>, status: TaskStatus): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      const task = event.container.data[event.currentIndex];
      this.updateTaskStatus(task, status);
    }
  }

  updateTaskStatus(task: ITask, status: TaskStatus): void {
    if (!this.canEditTask()) {
      this.notificationService.error('You do not have permission to update tasks');
      this.loadTasks();
      return;
    }
    this.taskService.updateTask(task.id, { status }).subscribe({
      next: (updated) => {
        const index = this.tasks.findIndex((t) => t.id === task.id);
        if (index !== -1) {
          this.tasks[index] = updated;
        }
        this.notificationService.success('Task updated successfully');
      },
      error: () => {
        this.notificationService.error('Failed to update task');
        this.loadTasks(); // Reload to revert changes
      },
    });
  }

  openNewTaskModal(): void {
    if (!this.canCreateTask()) {
      this.notificationService.error('You do not have permission to create tasks');
      return;
    }
    this.selectedTask = null;
    this.showTaskModal = true;
  }

  openEditTaskModal(task: ITask): void {
    if (!this.canEditTask()) {
      this.notificationService.error('You do not have permission to edit tasks');
      return;
    }
    this.selectedTask = task;
    this.showTaskModal = true;
  }

  closeTaskModal(): void {
    this.showTaskModal = false;
    this.selectedTask = null;
  }

  onTaskSaved(): void {
    this.closeTaskModal();
    this.loadTasks();
  }

  deleteTask(task: ITask): void {
    if (!this.canDeleteTask()) {
      this.notificationService.error('You do not have permission to delete tasks');
      return;
    }
    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) {
      return;
    }

    this.taskService.deleteTask(task.id).subscribe({
      next: () => {
        this.notificationService.success('Task deleted successfully');
        this.loadTasks();
      },
      error: () => {
        this.notificationService.error('Failed to delete task');
      },
    });
  }

  toggleDarkMode(): void {
    this.darkMode = !this.darkMode;
    if (this.darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }

  loadDarkMode(): void {
    const darkMode = localStorage.getItem('darkMode');
    this.darkMode = darkMode === 'true';
    if (this.darkMode) {
      document.documentElement.classList.add('dark');
    }
  }

  logout(): void {
    this.authService.logout();
  }

  getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      LOW: 'bg-green-200 text-green-900 font-extrabold dark:bg-green-500 dark:text-gray-900',
      MEDIUM: 'bg-yellow-200 text-yellow-900 font-extrabold dark:bg-yellow-400 dark:text-gray-900',
      HIGH: 'bg-red-200 text-red-900 font-extrabold dark:bg-red-500 dark:text-white',
    };
    return colors[priority] || colors['MEDIUM'];
  }

  getTaskStats() {
    const todoCount = this.tasks.filter(t => t.status === TaskStatus.TODO).length;
    const inProgressCount = this.tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const doneCount = this.tasks.filter(t => t.status === TaskStatus.DONE).length;
    
    return {
      total: this.tasks.length,
      todo: todoCount,
      inProgress: inProgressCount,
      done: doneCount,
      completionRate: this.tasks.length
        ? Math.round((doneCount / this.tasks.length) * 100)
        : 0,
    };
  }

  getTasksByPriority(priority: string): number {
    return this.tasks.filter(task => task.priority === priority).length;
  }

  canCreateTask(): boolean {
    const role = this.currentUser?.role?.name || this.currentUser?.role;
    return role === 'Owner' || role === 'Admin';
  }

  canEditTask(): boolean {
    const role = this.currentUser?.role?.name || this.currentUser?.role;
    return role === 'Owner' || role === 'Admin';
  }

  canDeleteTask(): boolean {
    const role = this.currentUser?.role?.name || this.currentUser?.role;
    return role === 'Owner' || role === 'Admin';
  }
}
