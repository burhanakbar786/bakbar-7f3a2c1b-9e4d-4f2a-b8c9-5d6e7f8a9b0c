import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TaskService } from '../../core/services/task.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ITask, TaskStatus, TaskPriority } from '@app/data';
import { TaskModalComponent } from '../task-modal/task-modal.component';
import { NotificationComponent } from '../../shared/notification/notification.component';

@Component({
  selector: 'app-task-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, TaskModalComponent, NotificationComponent],
  templateUrl: './task-dashboard.component.html',
  styleUrls: ['./task-dashboard.component.css'],
})
export class TaskDashboardComponent implements OnInit {
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
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
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
    this.selectedTask = null;
    this.showTaskModal = true;
  }

  openEditTaskModal(task: ITask): void {
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
      LOW: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      HIGH: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[priority] || colors.MEDIUM;
  }

  getTaskStats() {
    return {
      total: this.tasks.length,
      todo: this.todoTasks.length,
      inProgress: this.inProgressTasks.length,
      done: this.doneTasks.length,
      completionRate: this.tasks.length
        ? Math.round((this.doneTasks.length / this.tasks.length) * 100)
        : 0,
    };
  }
}
