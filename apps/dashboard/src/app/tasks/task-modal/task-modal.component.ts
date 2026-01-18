import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ITask, TaskStatus, TaskPriority, CreateTaskDto, UpdateTaskDto } from '@app/data';
import { TaskService } from '../../core/services/task.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-task-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-modal.component.html',
  styleUrls: ['./task-modal.component.css'],
})
export class TaskModalComponent implements OnInit {
  @Input() task: ITask | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<ITask>();

  taskForm: FormGroup;
  loading = false;
  statuses = Object.values(TaskStatus);
  priorities = Object.values(TaskPriority);
  categories = ['Work', 'Personal', 'Urgent', 'Meeting'];

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private notificationService: NotificationService,
  ) {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      status: [TaskStatus.TODO, Validators.required],
      priority: [TaskPriority.MEDIUM, Validators.required],
      category: ['Work', Validators.required],
      dueDate: [''],
    });
  }

  ngOnInit(): void {
    if (this.task) {
      this.taskForm.patchValue({
        title: this.task.title,
        description: this.task.description || '',
        status: this.task.status,
        priority: this.task.priority,
        category: this.task.category,
        dueDate: this.task.dueDate
          ? new Date(this.task.dueDate).toISOString().split('T')[0]
          : '',
      });
    }
  }

  onSubmit(): void {
    if (this.taskForm.invalid) {
      return;
    }

    this.loading = true;
    const formValue = this.taskForm.value;

    if (this.task) {
      // Update existing task
      const updateDto: UpdateTaskDto = formValue;
      this.taskService.updateTask(this.task.id, updateDto).subscribe({
        next: () => {
          this.notificationService.success('Task updated successfully');
          this.saved.emit();
        },
        error: () => {
          this.loading = false;
          this.notificationService.error('Failed to update task');
        },
      });
    } else {
      // Create new task
      const createDto: CreateTaskDto = formValue;
      this.taskService.createTask(createDto).subscribe({
        next: () => {
          this.notificationService.success('Task created successfully');
          this.saved.emit();
        },
        error: () => {
          this.loading = false;
          this.notificationService.error('Failed to create task');
        },
      });
    }
  }

  onDelete(): void {
    if (this.task) {
      this.deleted.emit(this.task);
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
