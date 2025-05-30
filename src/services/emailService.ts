import emailjs from '@emailjs/browser';

class EmailService {
  // 환경변수에서 설정값 가져오기 (실제 사용 시 .env 파일에 설정)
  private serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID || 'service_naver_mail';
  private templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'template_qjupabs';
  private publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY || 'KisPJHRkizPV91n6S';
  
  // 환경 변수로 시뮬레이션 모드 제어 (임시로 false로 설정)
  private isSimulation = false;

  constructor() {
    // 디버깅: 환경 변수 확인
    console.log('🔍 EmailService 환경 변수 확인:');
    console.log('- REACT_APP_EMAILJS_SERVICE_ID:', process.env.REACT_APP_EMAILJS_SERVICE_ID);
    console.log('- REACT_APP_EMAILJS_TEMPLATE_ID:', process.env.REACT_APP_EMAILJS_TEMPLATE_ID);
    console.log('- REACT_APP_EMAILJS_PUBLIC_KEY:', process.env.REACT_APP_EMAILJS_PUBLIC_KEY);
    console.log('- REACT_APP_ENVIRONMENT:', process.env.REACT_APP_ENVIRONMENT);
    console.log('- serviceId:', this.serviceId);
    console.log('- isSimulation:', this.isSimulation);
    
    // EmailJS 초기화 (실제 환경에서만)
    if (!this.isSimulation) {
      emailjs.init(this.publicKey);
    }
  }

  async sendNotificationEmail(
    recipientEmail: string,
    recipientName: string,
    subject: string,
    message: string,
    actionUrl?: string
  ) {
    // 개발 환경에서는 시뮬레이션
    if (this.isSimulation) {
      return this.simulateEmail(recipientEmail, recipientName, subject, message, actionUrl);
    }

    try {
      const templateParams = {
        to_email: recipientEmail,
        to_name: recipientName,
        subject: subject,
        message: message,
        action_url: actionUrl || '',
        from_name: '부품관리시스템',
        reply_to: 'noreply@parts-system.com',
      };

      const result = await emailjs.send(
        this.serviceId,
        this.templateId,
        templateParams,
        this.publicKey
      );

      console.log('✅ 이메일 발송 성공:', result);
      return { success: true, messageId: result.text };
    } catch (error) {
      console.error('❌ 이메일 발송 실패:', error);
      return { success: false, error: error };
    }
  }

  // 개발 환경 시뮬레이션
  private async simulateEmail(
    recipientEmail: string,
    recipientName: string,
    subject: string,
    message: string,
    actionUrl?: string
  ) {
    console.log('📧 ===== 이메일 알림 시뮬레이션 시작 =====');
    console.log('📮 서비스 ID:', this.serviceId);
    console.log('📋 템플릿 ID:', this.templateId);
    console.log('📧 수신자:', `${recipientName} <${recipientEmail}>`);
    console.log('📝 제목:', subject);
    console.log('💬 내용:');
    console.log('─'.repeat(50));
    console.log(message);
    if (actionUrl) {
      console.log('🔗 액션 URL:', actionUrl);
    }
    console.log('─'.repeat(50));

    // 95% 성공률로 시뮬레이션
    const success = Math.random() > 0.05;
    
    return new Promise<{ success: boolean; messageId?: string; error?: string }>(resolve => {
      setTimeout(() => {
        if (success) {
          console.log('✅ 이메일 발송 성공! (시뮬레이션)');
          resolve({
            success: true,
            messageId: `sim_email_${Date.now()}`
          });
        } else {
          console.log('❌ 이메일 발송 실패 (시뮬레이션)');
          resolve({
            success: false,
            error: '시뮬레이션 에러'
          });
        }
        console.log('📧 ===== 이메일 알림 시뮬레이션 종료 =====\n');
      }, 1200); // 1.2초 지연
    });
  }

  // 구매 요청 생성 알림
  async notifyPurchaseRequestCreated(
    recipientEmail: string,
    recipientName: string,
    requestorName: string,
    partName: string,
    importance: string,
    requestId: string
  ) {
    const urgencyText = importance === 'urgent' ? '🚨 긴급' : importance === 'high' ? '⚡ 높음' : '📋 보통';
    const subject = `[부품관리시스템] 신규 구매 요청 - ${partName}`;
    
    const message = `
안녕하세요 ${recipientName}님,

새로운 구매 요청이 등록되었습니다.

📋 요청 정보:
• 요청자: ${requestorName}
• 부품명: ${partName}
• 중요도: ${urgencyText}
• 요청일: ${new Date().toLocaleDateString('ko-KR')}

신속한 처리 부탁드립니다.

감사합니다.
부품관리시스템
    `.trim();

    const actionUrl = `${window.location.origin}/purchase-requests/${requestId}`;
    
    return await this.sendNotificationEmail(
      recipientEmail,
      recipientName,
      subject,
      message,
      actionUrl
    );
  }

  // 긴급 요청 알림
  async notifyUrgentRequest(
    recipientEmail: string,
    recipientName: string,
    requestorName: string,
    partName: string,
    urgentReason: string,
    requestId: string
  ) {
    const subject = `🚨 [긴급] 부품관리시스템 긴급 요청 - ${partName}`;
    
    const message = `
안녕하세요 ${recipientName}님,

긴급 구매 요청이 접수되었습니다.

🚨 긴급 요청 정보:
• 요청자: ${requestorName}
• 부품명: ${partName}
• 긴급 사유: ${urgentReason}
• 요청일시: ${new Date().toLocaleDateString('ko-KR')} ${new Date().toLocaleTimeString('ko-KR')}

⚡ 즉시 처리가 필요합니다!

감사합니다.
부품관리시스템
    `.trim();

    const actionUrl = `${window.location.origin}/purchase-requests/${requestId}`;
    
    return await this.sendNotificationEmail(
      recipientEmail,
      recipientName,
      subject,
      message,
      actionUrl
    );
  }

  // 상태 변경 알림
  async notifyStatusChange(
    recipientEmail: string,
    recipientName: string,
    partName: string,
    newStatus: string,
    requestId: string,
    requestorName?: string
  ) {
    const statusMessages: Record<string, string> = {
      'ecount_registered': '이카운트 등록 완료',
      'po_completed': '발주 완료',
      'warehouse_received': '입고 완료',
      'branch_dispatched': '지점 출고 완료',
      'completed': '처리 완료'
    };

    const statusText = statusMessages[newStatus] || newStatus;
    const subject = `[부품관리시스템] 상태 변경 알림 - ${partName}`;
    
    const message = `
안녕하세요 ${recipientName}님,

구매 요청의 상태가 변경되었습니다.

📋 변경 정보:
• 부품명: ${partName}
${requestorName ? `• 요청자: ${requestorName}\n` : ''}• 새 상태: ${statusText}
• 변경일시: ${new Date().toLocaleDateString('ko-KR')} ${new Date().toLocaleTimeString('ko-KR')}

자세한 내용은 시스템에서 확인해주세요.

감사합니다.
부품관리시스템
    `.trim();

    const actionUrl = `${window.location.origin}/purchase-requests/${requestId}`;
    
    return await this.sendNotificationEmail(
      recipientEmail,
      recipientName,
      subject,
      message,
      actionUrl
    );
  }

  // 지연 요청 경고
  async notifyOverdueRequest(
    recipientEmail: string,
    recipientName: string,
    partName: string,
    overdueDays: number,
    requestId: string,
    currentStatus: string
  ) {
    const subject = `⚠️ [지연경고] 부품관리시스템 처리 지연 - ${partName}`;
    
    const message = `
안녕하세요 ${recipientName}님,

구매 요청이 지연되고 있습니다.

⚠️ 지연 정보:
• 부품명: ${partName}
• 지연일수: ${overdueDays}일
• 현재 상태: ${currentStatus}
• 확인일: ${new Date().toLocaleDateString('ko-KR')}

즉시 처리 부탁드립니다.

감사합니다.
부품관리시스템
    `.trim();

    const actionUrl = `${window.location.origin}/purchase-requests/${requestId}`;
    
    return await this.sendNotificationEmail(
      recipientEmail,
      recipientName,
      subject,
      message,
      actionUrl
    );
  }

  // 시스템 알림
  async notifySystemMessage(
    recipientEmail: string,
    recipientName: string,
    title: string,
    message: string,
    type: 'info' | 'warning' | 'error' = 'info'
  ) {
    const icons = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '🚨'
    };

    const subject = `${icons[type]} [부품관리시스템] ${title}`;
    
    const formattedMessage = `
안녕하세요 ${recipientName}님,

${message}

시간: ${new Date().toLocaleDateString('ko-KR')} ${new Date().toLocaleTimeString('ko-KR')}

감사합니다.
부품관리시스템
    `.trim();

    return await this.sendNotificationEmail(
      recipientEmail,
      recipientName,
      subject,
      formattedMessage
    );
  }

  // 이메일 서비스 상태 확인
  async checkEmailService() {
    if (this.isSimulation) {
      console.log('📧 이메일 서비스 시뮬레이션 모드');
      return { 
        success: true, 
        simulation: true,
        message: '시뮬레이션 모드에서 실행 중입니다.' 
      };
    }

    try {
      // 테스트 이메일 발송 (실제로는 발송하지 않고 설정만 확인)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const testParams = {
        to_email: 'test@example.com',
        to_name: 'Test User',
        subject: 'Test',
        message: 'Test message',
        from_name: '부품관리시스템',
      };

      // EmailJS 설정 유효성 검사
      if (!this.serviceId || !this.templateId || !this.publicKey) {
        return { 
          success: false, 
          error: 'EmailJS 설정이 완료되지 않았습니다.' 
        };
      }

      console.log('✅ 이메일 서비스 설정 확인 완료');
      return { 
        success: true, 
        simulation: false,
        serviceId: this.serviceId,
        templateId: this.templateId
      };
    } catch (error) {
      console.error('❌ 이메일 서비스 확인 실패:', error);
      return { 
        success: false, 
        error: '이메일 서비스 오류' 
      };
    }
  }
}

export const emailService = new EmailService(); 