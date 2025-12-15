  const libraryPassage = (
    <div className="space-y-4 text-sm">
        <div className="font-bold text-center mb-2">[秋川大学 - 秋川大学図書館 - 一般利用]</div>
        <h4 className="font-bold text-base text-center mb-4">一般の方の図書館利用について</h4>
        
        <p>秋川大学の学生以外の一般の方も、研究等の目的のために、秋川キャンパスにある中央図書館と文学部図書館の資料が利用できます。</p>

        <div> 
            <h5 className="font-bold mb-1">【入館方法】</h5>
            <ul className="list-disc pl-5 space-y-1">
                <li>図書館利用カードをお持ちの方は、自動入退館ゲートから入退館ができます。</li>
                <li>お持ちでない方は、カウンターで一日入館証を発行いたします。</li>
            </ul>
        </div>

        <div>
            <h5 className="font-bold mb-1">【図書館利用カードについて】</h5>
            <ul className="list-disc pl-5 space-y-1">
                <li>図書館利用カードは、図書館資料の貸し出しの際に必要になります。</li>
                <li>発行をご希望の方は、身分証明書をお持ちになり、中央図書館、または文学部図書館のカウンターにお越しください(文学部図書館では平日のみ受け付けています)。</li>
                <li>平日の9時から17時までの間に申請を受け付けた場合、その日のうちにカードをお渡しします。平日の17時以降、および土日に受け付けた場合は、次の平日開館日以降にお渡しします。</li>
            </ul>
        </div>
        
        <div>
           <h5 className="font-bold mb-1">【開館時間】</h5>
           <table className="w-full border-collapse border border-zinc-300 dark:border-zinc-700 text-xs md:text-sm">
               <thead>
                   <tr className="bg-zinc-200 dark:bg-zinc-800">
                       <th className="border border-zinc-300 dark:border-zinc-700 p-2"></th>
                       <th className="border border-zinc-300 dark:border-zinc-700 p-2">期間※</th>
                       <th className="border border-zinc-300 dark:border-zinc-700 p-2">平日</th>
                       <th className="border border-zinc-300 dark:border-zinc-700 p-2">土曜・日曜</th>
                   </tr>
               </thead>
               <tbody>
                   <tr>
                       <td className="border border-zinc-300 dark:border-zinc-700 p-2 font-bold" rowSpan={2}>中央<br/>図書館</td>
                       <td className="border border-zinc-300 dark:border-zinc-700 p-2">授業期間</td>
                       <td className="border border-zinc-300 dark:border-zinc-700 p-2">9:00 ~ 22:00</td>
                       <td className="border border-zinc-300 dark:border-zinc-700 p-2">9:00 ~ 17:00</td>
                   </tr>
                    <tr>
                       <td className="border border-zinc-300 dark:border-zinc-700 p-2">夏休み・春休み期間</td>
                       <td className="border border-zinc-300 dark:border-zinc-700 p-2">9:00 ~ 19:00</td>
                       <td className="border border-zinc-300 dark:border-zinc-700 p-2">休館</td>
                   </tr>
                    <tr>
                       <td className="border border-zinc-300 dark:border-zinc-700 p-2 font-bold" rowSpan={2}>文学部<br/>図書館</td>
                       <td className="border border-zinc-300 dark:border-zinc-700 p-2">授業期間</td>
                       <td className="border border-zinc-300 dark:border-zinc-700 p-2">9:00 ~ 21:00</td>
                       <td className="border border-zinc-300 dark:border-zinc-700 p-2">9:00 ~ 17:00</td>
                   </tr>
                    <tr>
                       <td className="border border-zinc-300 dark:border-zinc-700 p-2">夏休み・春休み期間</td>
                       <td className="border border-zinc-300 dark:border-zinc-700 p-2">9:00 ~ 18:00</td>
                       <td className="border border-zinc-300 dark:border-zinc-700 p-2">休館</td>
                   </tr>
               </tbody>
           </table>
        </div>
    </div>
  );

  const libraryQuestions = [
      {
        id: 45,
        text: "筆者の考えに合うのはどれか。",
        correctChoiceId: 4, 
        choices: [
            { id: 1, text: "本当に実力があれば、練習でできなかったことでも試合でできる。" },
            { id: 2, text: "全力で練習したから試合でも成功するというのは、甘い考えだ。" },
            { id: 3, text: "練習でしっかりできていても、試合で実力を発揮するのは難しい。" },
            { id: 4, text: "練習にも全力で取り組まなければ、試合でいい結果は出せない。" },
        ]
      }
  ];
