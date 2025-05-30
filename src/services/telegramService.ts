class TelegramService {
  // 환경변수에서 설정값 가져오기 (실제 사용 시 .env 파일에 설정)
  private botToken = process.env.REACT_APP_TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN';
  private chatId = process.env.REACT_APP_TELEGRAM_CHAT_ID || 'YOUR_CHAT_ID';
  
  // 개발 환경에서는 시뮬레이션 모드
  private isSimulation = process.env.NODE_ENV === 'development' || !this.botToken.startsWith('bot');

  async sendMessage(message: string, parseMode: 'HTML' | 'Markdown' = 'HTML') {
    // 개발 환경에서는 시뮬레이션
    if (this.isSimulation) {
      return this.simulateMessage(message);
    }

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: message,
          parse_mode: parseMode,
          disable_web_page_preview: true,
        }),
      });

      const result = await response.json();
      
      if (result.ok) {
        console.log('✅ 텔레그램 메시지 발송 성공');
        return { success: true, messageId: result.result.message_id };
      } else {
        console.error('❌ 텔레그램 메시지 발송 실패:', result);
        return { success: false, error: result.description };
      }
    } catch (error) {
      console.error('❌ 텔레그램 API 호출 실패:', error);
      return { success: false, error: error };
    }
  }

  // 개발 환경 시뮬레이션
  private async simulateMessage(message: string) {
    console.log('📱 ===== 텔레그램 봇 알림 시뮬레이션 시작 =====');
    console.log('🤖 봇 토큰:', this.botToken.substring(0, 10) + '...');
    console.log('💬 채팅 ID:', this.chatId);
    console.log('📝 메시지 내용:');
    console.log('─'.repeat(50));
    console.log(message);
    console.log('─'.repeat(50));

    // 90% 성공률로 시뮬레이션
    const success = Math.random() > 0.1;
    
    return new Promise<{ success: boolean; messageId?: string; error?: string }>(resolve => {
      setTimeout(() => {
        if (success) {
          console.log('✅ 텔레그램 메시지 발송 성공! (시뮬레이션)');
          resolve({
            success: true,
            messageId: `sim_msg_${Date.now()}`
          });
        } else {
          console.log('❌ 텔레그램 메시지 발송 실패 (시뮬레이션)');
          resolve({
            success: false,
            error: '시뮬레이션 에러'
          });
        }
        console.log('📱 ===== 텔레그램 봇 알림 시뮬레이션 종료 =====\n');
      }, 800); // 0.8초 지연
    });
  }

  // 구매 요청 알림
  async notifyPurchaseRequest(
    requestorName: string,
    partName: string,
    importance: string,
    requestId: string
  ) {
    const urgencyIcon = importance === 'urgent' ? '🚨' : importance === 'high' ? '⚡' : '📋';
    const urgencyText = importance === 'urgent' ? '긴급' : importance === 'high' ? '높음' : '보통';
    
    const message = `
${urgencyIcon} <b>신규 구매 요청</b>

👤 <b>요청자:</b> ${requestorName}
🔧 <b>부품명:</b> ${partName}
📅 <b>요청일:</b> ${new Date().toLocaleDateString('ko-KR')}
⚡ <b>중요도:</b> ${urgencyText}

<a href="${window.location.origin}/purchase-requests/${requestId}">👉 처리하기</a>
    `.trim();

    return await this.sendMessage(message);
  }

  // 긴급 요청 알림
  async notifyUrgentRequest(
    requestorName: string,
    partName: string,
    urgentReason: string,
    requestId: string
  ) {
    const message = `
🚨 <b>긴급 요청 알림</b> 🚨

👤 <b>요청자:</b> ${requestorName}
🔧 <b>부품명:</b> ${partName}
📋 <b>긴급 사유:</b> ${urgentReason}
📅 <b>요청일:</b> ${new Date().toLocaleDateString('ko-KR')} ${new Date().toLocaleTimeString('ko-KR')}

⚡ <b>즉시 처리가 필요합니다!</b>

<a href="${window.location.origin}/purchase-requests/${requestId}">🚀 즉시 처리하기</a>
    `.trim();

    return await this.sendMessage(message);
  }

  // 상태 변경 알림
  async notifyStatusChange(
    partName: string,
    newStatus: string,
    requestId: string,
    requestorName?: string
  ) {
    const statusMessages: Record<string, { icon: string; text: string }> = {
      'ecount_registered': { icon: '📝', text: '이카운트 등록 완료' },
      'po_completed': { icon: '📋', text: '발주 완료' },
      'warehouse_received': { icon: '📦', text: '입고 완료' },
      'branch_dispatched': { icon: '🚚', text: '지점 출고 완료' },
      'completed': { icon: '✅', text: '처리 완료' }
    };

    const statusInfo = statusMessages[newStatus] || { icon: '📋', text: newStatus };
    
    const message = `
${statusInfo.icon} <b>상태 변경 알림</b>

🔧 <b>부품명:</b> ${partName}
${requestorName ? `👤 <b>요청자:</b> ${requestorName}\n` : ''}📋 <b>새 상태:</b> ${statusInfo.text}
📅 <b>변경일:</b> ${new Date().toLocaleDateString('ko-KR')} ${new Date().toLocaleTimeString('ko-KR')}

<a href="${window.location.origin}/purchase-requests/${requestId}">👉 상세보기</a>
    `.trim();

    return await this.sendMessage(message);
  }

  // 지연 요청 경고
  async notifyOverdueRequest(
    partName: string,
    overdueDays: number,
    requestId: string,
    currentStatus: string
  ) {
    const message = `
⚠️ <b>지연 요청 경고</b> ⚠️

🔧 <b>부품명:</b> ${partName}
⏰ <b>지연일수:</b> ${overdueDays}일
📋 <b>현재 상태:</b> ${currentStatus}
📅 <b>확인일:</b> ${new Date().toLocaleDateString('ko-KR')}

🔥 <b>즉시 처리가 필요합니다!</b>

<a href="${window.location.origin}/purchase-requests/${requestId}">🚀 즉시 처리하기</a>
    `.trim();

    return await this.sendMessage(message);
  }

  // 시스템 알림
  async notifySystemMessage(
    title: string,
    message: string,
    type: 'info' | 'warning' | 'error' = 'info'
  ) {
    const icons = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '🚨'
    };

    const formattedMessage = `
${icons[type]} <b>${title}</b>

${message}

📅 <b>시간:</b> ${new Date().toLocaleDateString('ko-KR')} ${new Date().toLocaleTimeString('ko-KR')}
    `.trim();

    return await this.sendMessage(formattedMessage);
  }

  // 봇 설정 상태 확인
  async checkBotStatus() {
    if (this.isSimulation) {
      console.log('📱 텔레그램 봇 시뮬레이션 모드');
      return { 
        success: true, 
        simulation: true,
        message: '시뮬레이션 모드에서 실행 중입니다.' 
      };
    }

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/getMe`;
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.ok) {
        console.log('✅ 텔레그램 봇 연결 성공:', result.result.username);
        return { 
          success: true, 
          simulation: false,
          botInfo: result.result 
        };
      } else {
        console.error('❌ 텔레그램 봇 연결 실패:', result);
        return { 
          success: false, 
          error: result.description 
        };
      }
    } catch (error) {
      console.error('❌ 텔레그램 봇 상태 확인 실패:', error);
      return { 
        success: false, 
        error: '네트워크 오류' 
      };
    }
  }
}

export const telegramService = new TelegramService(); 