import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditorModule } from 'primeng/editor';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { QuoteService, Quote } from '../../../services/quote.service';

declare var bootstrap: any;

@Component({
  standalone: true,
  templateUrl: './quote.component.html',
  styleUrls: ['./quote.component.css'],
  imports: [CommonModule, FormsModule, EditorModule, ToastModule],
  providers: [MessageService],
})
export class QuoteComponent implements OnInit, OnDestroy, AfterViewInit {
  quotes: Quote[] = [];
  selectedQuote: Quote | null = null;
  loading: boolean = false;
  selectedStatus: string = '';
  currentPage: number = 1;
  pageSize: number = 10;
  totalQuotes: number = 0;
  totalPages: number = 0;

  replyMessage: string = '';
  sendingReply: boolean = false;
  quoteToDelete: string | null = null;

  Math = Math;

  private viewDetailModal: any;
  private replyModal: any;
  private deleteConfirmModal: any;

  constructor(
    private quoteService: QuoteService,
    private messageService: MessageService
  ) {
    console.log('[DEBUG_QUOTE] Constructor called');
  }

  hasReplyContent(): boolean {
    if (!this.replyMessage) return false;
    const tmp = document.createElement('DIV');
    tmp.innerHTML = this.replyMessage;
    const textContent = tmp.textContent || tmp.innerText || '';
    return textContent.trim().length > 0;
  }

  ngOnInit(): void {
    console.log('[DEBUG_QUOTE] ngOnInit called');
    this.loadQuotes();
  }

  ngAfterViewInit() {
    console.log('[DEBUG_QUOTE] ngAfterViewInit called');
    // Use setTimeout to ensure DOM is fully rendered
    setTimeout(() => {
      this.initializeModals();
    }, 0);
  }

  ngOnDestroy() {
    console.log('[DEBUG_QUOTE] ngOnDestroy called');
    // Cleanup Bootstrap modals to prevent memory leaks
    console.log('[DEBUG_QUOTE] Disposing modals:', {
      viewDetailModal: !!this.viewDetailModal,
      replyModal: !!this.replyModal,
      deleteConfirmModal: !!this.deleteConfirmModal
    });
    this.viewDetailModal?.dispose();
    this.replyModal?.dispose();
    this.deleteConfirmModal?.dispose();
  }

  initializeModals() {
    console.log('[DEBUG_QUOTE] initializeModals called');

    // Check if bootstrap is available
    if (typeof bootstrap === 'undefined') {
      console.error('[DEBUG_QUOTE] Bootstrap is not defined! Retrying in 500ms...');
      setTimeout(() => this.initializeModals(), 500);
      return;
    }

    // Initialize Bootstrap modals
    const viewDetailModalEl = document.getElementById('viewDetailModal');
    const replyModalEl = document.getElementById('replyModal');
    const deleteConfirmModalEl = document.getElementById('deleteConfirmModal');

    console.log('[DEBUG_QUOTE] Modal elements found:', {
      viewDetailModalEl: !!viewDetailModalEl,
      replyModalEl: !!replyModalEl,
      deleteConfirmModalEl: !!deleteConfirmModalEl
    });

    if (!viewDetailModalEl || !replyModalEl || !deleteConfirmModalEl) {
      console.error('[DEBUG_QUOTE] Some modal elements not found! Retrying in 500ms...');
      setTimeout(() => this.initializeModals(), 500);
      return;
    }

    // Dispose old instances if they exist
    if (this.viewDetailModal) {
      console.log('[DEBUG_QUOTE] Disposing old viewDetailModal');
      this.viewDetailModal.dispose();
    }
    if (this.replyModal) {
      console.log('[DEBUG_QUOTE] Disposing old replyModal');
      this.replyModal.dispose();
    }
    if (this.deleteConfirmModal) {
      console.log('[DEBUG_QUOTE] Disposing old deleteConfirmModal');
      this.deleteConfirmModal.dispose();
    }

    try {
      console.log('[DEBUG_QUOTE] Creating new modal instances...');
      this.viewDetailModal = new bootstrap.Modal(viewDetailModalEl);
      this.replyModal = new bootstrap.Modal(replyModalEl);
      this.deleteConfirmModal = new bootstrap.Modal(deleteConfirmModalEl);

      console.log('[DEBUG_QUOTE] Modal instances created successfully:', {
        viewDetailModal: !!this.viewDetailModal,
        replyModal: !!this.replyModal,
        deleteConfirmModal: !!this.deleteConfirmModal
      });
    } catch (error) {
      console.error('[DEBUG_QUOTE] Error creating modal instances:', error);
    }
  }

  loadQuotes() {
    console.log('[DEBUG_QUOTE] loadQuotes called');
    this.loading = true;
    this.quoteService.getQuotes(this.selectedStatus, this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.quotes = response.data;
        this.totalQuotes = response.total;
        this.totalPages = Math.ceil(this.totalQuotes / this.pageSize);
        this.loading = false;
        console.log('[DEBUG_QUOTE] Quotes loaded successfully');
      },
      error: (error) => {
        console.error('Error loading quotes:', error);
        this.loading = false;
      }
    });
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadQuotes();
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadQuotes();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  viewDetail(quote: Quote) {
    console.log('[DEBUG_QUOTE] viewDetail called:', quote._id);
    console.log('[DEBUG_QUOTE] viewDetailModal exists:', !!this.viewDetailModal);
    this.selectedQuote = quote;

    // Mark as read if unread
    if (quote.status === 'unread') {
      this.quoteService.markAsRead(quote._id).subscribe({
        next: () => {
          quote.status = 'read';
          console.log('[DEBUG_QUOTE] Marked as read:', quote._id);
        },
        error: (error) => {
          console.error('Error marking as read:', error);
        }
      });
    }

    console.log('[DEBUG_QUOTE] Attempting to show viewDetailModal');
    this.viewDetailModal?.show();
  }

  markAsRead(id: string) {
    console.log('[DEBUG_QUOTE] markAsRead called:', id);
    this.quoteService.markAsRead(id).subscribe({
      next: () => {
        const quote = this.quotes.find(q => q._id === id);
        if (quote) {
          quote.status = 'read';
        }
        console.log('[DEBUG_QUOTE] Successfully marked as read:', id);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Message marked as read',
          life: 3000
        });
      },
      error: (error) => {
        console.error('[DEBUG_QUOTE] Error marking as read:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to mark as read',
          life: 3000
        });
      }
    });
  }

  openReplyDialog(quote: Quote) {
    console.log('[DEBUG_QUOTE] openReplyDialog called:', quote._id);
    console.log('[DEBUG_QUOTE] replyModal exists:', !!this.replyModal);
    this.selectedQuote = quote;
    this.replyMessage = '';
    console.log('[DEBUG_QUOTE] Attempting to show replyModal');
    this.replyModal?.show();
  }

  openReplyDialogFromDetail() {
    this.viewDetailModal?.hide();
    setTimeout(() => {
      this.replyModal?.show();
    }, 300);
  }

  sendReply() {
    // Strip HTML tags to check if there's actual text content
    const stripHtml = (html: string) => {
      const tmp = document.createElement('DIV');
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || '';
    };

    const textContent = this.replyMessage ? stripHtml(this.replyMessage).trim() : '';

    if (!this.selectedQuote || !textContent) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please enter a reply message',
        life: 3000
      });
      return;
    }

    this.sendingReply = true;
    this.quoteService.sendReply(this.selectedQuote._id, this.replyMessage).subscribe({
      next: () => {
        this.sendingReply = false;
        this.replyModal?.hide();

        // Update quote status
        if (this.selectedQuote) {
          this.selectedQuote.status = 'replied';
          this.selectedQuote.replyMessage = this.replyMessage;
          this.selectedQuote.repliedAt = new Date();

          // Update in list
          const quote = this.quotes.find(q => q._id === this.selectedQuote?._id);
          if (quote) {
            quote.status = 'replied';
            quote.replyMessage = this.replyMessage;
            quote.repliedAt = new Date();
          }
        }

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Reply sent successfully! Email has been delivered to the user.',
          life: 5000
        });
        this.replyMessage = '';
      },
      error: (error) => {
        console.error('Error sending reply:', error);
        this.sendingReply = false;

        let errorMessage = 'Failed to send reply. Please try again.';
        if (error?.error?.msg) {
          errorMessage = error.error.msg;
        } else if (error?.message) {
          errorMessage = error.message;
        }

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 5000
        });
      }
    });
  }

  confirmDelete(id: string) {
    console.log('[DEBUG_QUOTE] confirmDelete called:', id);
    console.log('[DEBUG_QUOTE] deleteConfirmModal exists:', !!this.deleteConfirmModal);
    this.quoteToDelete = id;
    console.log('[DEBUG_QUOTE] Attempting to show deleteConfirmModal');
    this.deleteConfirmModal?.show();
  }

  deleteQuote() {
    console.log('[DEBUG_QUOTE] deleteQuote called');
    if (!this.quoteToDelete) {
      console.log('[DEBUG_QUOTE] No quote to delete');
      return;
    }

    const id = this.quoteToDelete;
    console.log('[DEBUG_QUOTE] Deleting quote:', id);
    this.quoteService.deleteQuote(id).subscribe({
      next: () => {
        this.quotes = this.quotes.filter(q => q._id !== id);
        this.totalQuotes--;
        this.deleteConfirmModal?.hide();
        this.quoteToDelete = null;
        console.log('[DEBUG_QUOTE] Quote deleted successfully:', id);

        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'Message deleted successfully',
          life: 3000
        });
      },
      error: (error) => {
        console.error('[DEBUG_QUOTE] Error deleting quote:', error);
        this.deleteConfirmModal?.hide();
        this.quoteToDelete = null;

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete message',
          life: 3000
        });
      }
    });
  }

  cancelDelete() {
    console.log('[DEBUG_QUOTE] cancelDelete called');
    this.quoteToDelete = null;
    this.deleteConfirmModal?.hide();
  }
}
