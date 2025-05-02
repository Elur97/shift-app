//従業員としてログインした場合のシフト希望入力ページ

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

//パラメータの初期化

export default function ShiftInputPage() {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [employeeName, setEmployeeName] = useState('');
  const [isHolidayRequest, setIsHolidayRequest] = useState(false);

  //Firebaseのコレクション(shiftRequests-test)からシフトデータを全取得してeventsにセット
  useEffect(() => {
    const savedName = localStorage.getItem('employeeName');
    if (savedName) setEmployeeName(savedName);
  //イベントのフェッチ
    const fetchEvents = async () => {
      const querySnapshot = await getDocs(collection(db, 'shiftRequests-test'));
      const loadedEvents = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const date = data.date;
        const start = new Date(`${date}T${data.startTime || '00:00'}`);
        const end = data.endTime ? new Date(`${date}T${data.endTime}`) : null;

        return {
          id: doc.id,
          title: data.isHolidayRequest ? '希望休' : data.title,
          users: data.users,
          start: start,
          end: end,
          isHolidayRequest: data.isHolidayRequest || false,
        };
      });
      setEvents(loadedEvents);
    };

    fetchEvents();
  }, []);

  const handleDateClick = (arg) => {
    setSelectedDate(arg.date);
    setEditingEvent(null);
    setStartTime('');
    setEndTime('');
    setIsHolidayRequest(false);
    setShowModal(true);
  };

  const handleEditClick = (event) => {
    const date = new Date(event.start);
    setSelectedDate(date);
    setStartTime(event.start.toTimeString().slice(0, 5));
    setEndTime(event.end ? event.end.toTimeString().slice(0, 5) : ''); 
    setEditingEvent(event);
    setIsHolidayRequest(event.isHolidayRequest || false);
    setShowModal(true);
  };
  
  //シフトの登録と編集機能を実装
  const handleSubmit = async () => {
    if (!selectedDate || !employeeName) return;

    const dateStr = selectedDate.toISOString().split('T')[0];
    const title = isHolidayRequest ? '希望休' : `${startTime}〜${endTime}`;
    const users = employeeName;

    const start = new Date(selectedDate);
    const end = new Date(selectedDate);
    
    if (isHolidayRequest) {
      start.setHours(9, 0, 0, 0);
      end.setHours(10, 0, 0, 0);
    } else {
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      start.setHours(startHour, startMinute, 0, 0);
      end.setHours(endHour, endMinute, 0, 0);
    }
    

    const data = {
      title,
      date: dateStr,
      startTime: isHolidayRequest ? '09:00' : startTime,
      endTime: isHolidayRequest ? '10:00' : endTime,
      users,
      isHolidayRequest,
    };

    if (editingEvent) {
      const eventDoc = doc(db, 'shiftRequests-test', editingEvent.id);
      await updateDoc(eventDoc, data);

      const updatedEvents = events.map((event) =>
        event.id === editingEvent.id
          ? {
              ...event,
              title,
              start,
              end: isHolidayRequest ? null : end,
              users,
              isHolidayRequest,
            }
          : event
      );
      setEvents(updatedEvents);
    } else {
      const docRef = await addDoc(collection(db, 'shiftRequests-test'), data);

      setEvents([ 
        ...events,
        {
          id: docRef.id,
          title,
          start,
          end: isHolidayRequest ? null : end,
          users,
          isHolidayRequest,
        },
      ]);
    }

    setShowModal(false);
    setStartTime('');
    setEndTime('');
    setSelectedDate(null);
    setEditingEvent(null);
    setIsHolidayRequest(false);
  };

  //カレンダー上のイベントを削除する処理
  const handleDeleteEvent = async (id) => {
    const eventDoc = doc(db, 'shiftRequests-test', id);
    await deleteDoc(eventDoc);
    setEvents((prev) => prev.filter((event) => event.id !== id));
    setShowModal(false); 
    setEditingEvent(null); 
  };
  

  //レイアウト
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">シフト希望入力画面（従業員）</h1>

      <div className="mb-4">
        <label className="text-lg">従業員名:</label>
        <input
          type="text"
          value={employeeName}
          onChange={(e) => {
            setEmployeeName(e.target.value);
            localStorage.setItem('employeeName', e.target.value);
          }}
          className="p-2 border rounded"
          placeholder="従業員名を入力"
        />
      </div>

 {/*カレンダーの表示レイアウト */}
      <FullCalendar
        key={events.length}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth',
        }}
        selectable={false}
        editable={true}
        events={events}
        dateClick={handleDateClick}
        locale={jaLocale}
        timeZone="Asia/Tokyo"
        height="auto"
        eventContent={(arg) => {
          const isHoliday = arg.event.extendedProps.isHolidayRequest;
          return (
            <div
              className={`relative p-1 rounded ${
                isHoliday ? 'bg-red-200' : 'bg-blue-100'
              }`}
            >
              <div className="font-semibold text-sm break-words whitespace-normal">
                {isHoliday
                  ? '希望休'
                  : `${arg.event.start.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}〜${
                      arg.event.end
                        ? arg.event.end.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''
                    }`}
              </div>
              <div className="text-xs text-gray-600">
                {arg.event.extendedProps.users || '従業員名未設定'}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const targetEvent = events.find((evt) => evt.id === arg.event.id);
                  handleEditClick(targetEvent);
                }}
                className="text-xs text-blue-600 underline mt-1"
              >
                編集
              </button>
            </div>
          );
        }}
      />
  {/*カレンダー上の特定の日をクリックした時に表示される画面 */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-center">
              {editingEvent ? 'シフト編集' : 'シフト希望入力'}
            </h2>
            <p className="mb-4 text-center text-lg">
              選択日: {selectedDate?.toLocaleDateString()}
            </p>

            <div className="flex flex-col gap-4 text-lg">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isHolidayRequest}
                  onChange={(e) => setIsHolidayRequest(e.target.checked)}
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
                      onChange={(e) => setStartTime(e.target.value)}
                      className="mt-1 p-2 border rounded"
                    />
                  </label>
                  <label className="flex flex-col">
                    終了時刻:
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="mt-1 p-2 border rounded"
                    />
                  </label>
                </>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
  <button
    onClick={() => {
      setShowModal(false);
      setEditingEvent(null);
      setIsHolidayRequest(false);
    }}
    className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
  >
    キャンセル
  </button>
  {editingEvent && (
    <button
      onClick={() => handleDeleteEvent(editingEvent.id)}
      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
    >
      削除
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
    </div>
  );
}
