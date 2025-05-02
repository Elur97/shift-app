//シフト管理者画面

'use client';

import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import jaLocale from '@fullcalendar/core/locales/ja';
import { db } from '../../../../lib/firebase';
import {
  addDoc,
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

export default function ShiftApprovalPage() {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [employeeName, setEmployeeName] = useState('');
  const [isApproved, setIsApproved] = useState(false);
  const [isHolidayRequest, setIsHolidayRequest] = useState(false);

  // firestoreから登録されたイベント情報をフェッチ
  useEffect(() => {
    const savedName = localStorage.getItem('employeeName');
    if (savedName) setEmployeeName(savedName);

    async function fetchEvents() {
      const snapshot = await getDocs(collection(db, 'shiftRequests-test'));
      const loaded = snapshot.docs.map(docSnap => {
        const d = docSnap.data();
        const dateStr = d.date; 
    //希望休(isHolidayRequestがtrue)を選択していた場合
        if (d.isHolidayRequest) {
          return {
            id: docSnap.id,
            title: '希望休',
            users: d.users,
            start: new Date(`${dateStr}T00:00:00`),
            allDay: true,
            extendedProps: { isHolidayRequest: true, users: d.users },
          };
        } else {
      //通常のシフト入力が行われていた場合の処理
          return {
            id: docSnap.id,
            title: d.title,
            users: d.users,
            start: new Date(`${dateStr}T${d.startTime}`),
            end: d.endTime ? new Date(`${dateStr}T${d.endTime}`) : null,
            allDay: false,
            extendedProps: { isHolidayRequest: false, users: d.users },
          };
        }
      });
      setEvents(loaded);
    }

    fetchEvents();
  }, []);

  // カレンダーの日付をクリックすると編集画面のモーダルが開く
  const handleDateClick = arg => {
    if (isApproved) return;
    setSelectedDate(arg.date);
    setEditingEvent(null);
    setStartTime('');
    setEndTime('');
    setIsHolidayRequest(false);
    setShowModal(true);
  };

  const handleEditClick = evt => {
    if (isApproved) return;
    const d = new Date(evt.start);
    setSelectedDate(d);
    setIsHolidayRequest(evt.extendedProps.isHolidayRequest);
    if (evt.extendedProps.isHolidayRequest) {
      setStartTime('');
      setEndTime('');
    } else {
      setStartTime(d.toTimeString().slice(0, 5));
      setEndTime(evt.end ? new Date(evt.end).toTimeString().slice(0, 5) : '');
    }
    setEditingEvent(evt);
    setShowModal(true);
  };

  //
  const handleEventDrop = async arg => {
    if (isApproved) return;
    const e = arg.event;
    const dateStr = selectedDate.getFullYear() + '-' +
    String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' +
    String(selectedDate.getDate()).padStart(2, '0');
  
    const payload = { date: dateStr };
    if (e.extendedProps.isHolidayRequest) {
      payload.startTime = '';
      payload.endTime = '';
    } else {
      payload.startTime = e.start.toISOString().slice(11, 16);
      payload.endTime = e.end ? e.end.toISOString().slice(11, 16) : '';
    }
    await updateDoc(doc(db, 'shiftRequests-test', e.id), payload);
    setEvents(evts =>
      evts.map(ev =>
        ev.id === e.id
          ? { ...ev, start: e.start, end: e.end || null }
          : ev
      )
    );
  };

  const handleSubmit = async () => {
    if (!employeeName || !selectedDate) return;
    const dateStr = selectedDate.getFullYear() + '-' +
    String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' +
    String(selectedDate.getDate()).padStart(2, '0');
  
    const payload = {
      date: dateStr,
      users: employeeName,
      isHolidayRequest,
    };
    let newEvent = { users: employeeName, extendedProps: { isHolidayRequest } };

    if (isHolidayRequest) {
      payload.title      = '希望休';
      // 仮の時間を入れる
      payload.startTime  = '09:00';
      payload.endTime    = '10:00';
    
      newEvent = {
        ...newEvent,
        title: '希望休',
        // ダミー時間で start/end を生成
        start: new Date(`${dateStr}T09:00:00`),
        end:   new Date(`${dateStr}T10:00:00`),
        allDay: false,    // allDay:true のままだと時刻が無視されるのでご注意
      };
    
    } else {
      if (!startTime || !endTime) return;
      payload.title = `${startTime}〜${endTime}`;
      payload.startTime = startTime;
      payload.endTime = endTime;
      newEvent = {
        ...newEvent,
        title: payload.title,
        start: new Date(`${dateStr}T${startTime}`),
        end: new Date(`${dateStr}T${endTime}`),
        allDay: false,
      };
    }

    //日付を編集した場合の処理
    if (editingEvent) {
      
      await updateDoc(doc(db, 'shiftRequests-test', editingEvent.id), payload);
      setEvents(evts =>
        evts.map(ev =>
          ev.id === editingEvent.id
            ? { id: ev.id, ...newEvent, users: employeeName }
            : ev
        )
      );
    } else {
   //日付を追加する場合の処理
      const newDoc = await addDoc(collection(db, 'shiftRequests-test'), payload);
      setEvents(evts => [
        ...evts,
        { id: newDoc.id, ...newEvent, users: employeeName },
      ]);
    }

    setShowModal(false);
    setSelectedDate(null);
    setEditingEvent(null);
    setStartTime('');
    setEndTime('');
    setIsHolidayRequest(false);
  };

  //削除ボタンを押したらカレンダーに入力したイベントが消える
  const handleDelete = async id => {
    await deleteDoc(doc(db, 'shiftRequests-test', id));
    setEvents(evts => evts.filter(ev => ev.id !== id));
  };

  // シフト承認ボタンを押した時の処理(isApprovedでフラグで判断)
  const handleApprovalToggle = () => {
    if (
      confirm(
        isApproved
          ? '承認を取り消して編集可能にしますか？'
          : '編集を終了し、このシフトを承認しますか？'
      )
    ) {
      setIsApproved(a => !a);
    }
  };

  // シェア
  const handleShare = () => {
    const info =
      `従業員名: ${employeeName}\n` +
      `日付: ${selectedDate?.toLocaleDateString()}\n` +
      (isHolidayRequest
        ? '希望休'
        : `開始: ${startTime} 終了: ${endTime}`);
    if (navigator.share) {
      navigator.share({ title: 'シフト情報', text: info, url: location.href });
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">シフト承認画面（管理者）</h1>

      {/* 従業員名 */}
      <div className="mb-4">
        <label className="block mb-1">従業員名</label>
        <input
          type="text"
          className="border p-2 w-full"
          value={employeeName}
          onChange={e => {
            setEmployeeName(e.target.value);
            localStorage.setItem('employeeName', e.target.value);
          }}
        />
      </div>

      {/* カレンダー */}
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek',
        }}
        locale={jaLocale}
        editable={!isApproved}
        droppable={!isApproved}
        selectable={!isApproved}
        events={events}
        dateClick={handleDateClick}
        eventDrop={handleEventDrop}
        height="auto"
        eventContent={arg => {
          const e = arg.event;
          const hol = e.extendedProps.isHolidayRequest;
          return (
<div
  className={`p-1 break-words whitespace-normal ${hol ? 'bg-red-100 rounded border border-red-400' : ''}`}
>
              {hol ? (
                <>
                  <div className="text-sm font-semibold text-red-700">希望休</div>
                  <div className="text-xs text-gray-600">{e.extendedProps.users}</div>
                </>
              ) : (
                <>
                  <div className="text-sm">
                    {e.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    〜
                    {e.end?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-xs text-gray-600">{e.extendedProps.users}</div>
                </>
              )}
              <button
                onClick={ev => {
                  ev.stopPropagation();
                  handleEditClick(events.find(x => x.id === e.id));
                }}
                className="text-xs text-blue-600 underline ml-1"
              >
                編集
              </button>
            </div>
          );
        }}
      />

      {/* モーダル */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-center">
              {editingEvent ? 'シフト編集' : 'シフト入力'}
            </h2>
            <p className="mb-4 text-center text-lg">
              選択日: {selectedDate?.toLocaleDateString()}
            </p>

            <div className="flex flex-col gap-4 text-lg">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isHolidayRequest}
                  onChange={e => setIsHolidayRequest(e.target.checked)}
                />
                希望休（この日は勤務できません）
              </label>

              {!isHolidayRequest && (
                <>
                  <label className="flex flex-col">
                    開始時刻:
                    <input
                      type="time"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className="mt-1 p-2 border rounded"
                    />
                  </label>
                  <label className="flex flex-col">
                    終了時刻:
                    <input
                      type="time"
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      className="mt-1 p-2 border rounded"
                    />
                  </label>
                </>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                キャンセル
              </button>
              {editingEvent && (
                <button
                  onClick={() => {
                    if (confirm('このシフトを削除しますか？')) {
                      handleDelete(editingEvent.id);
                      setShowModal(false);
                    }
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  削除する
                </button>
              )}
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ボタン群 */}
      <div className="mt-4 text-center space-x-2">
        {!isApproved ? (
          <button
            onClick={handleApprovalToggle}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            シフトを承認する
          </button>
        ) : (
          <>
            <button
              onClick={handleApprovalToggle}
              className="px-4 py-2 bg-yellow-500 text-white rounded"
            >
              承認を取り消す
            </button>
            <button
              onClick={handleShare}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              シフトを共有する
            </button>
          </>
        )}
      </div>
    </div>
  );
}
