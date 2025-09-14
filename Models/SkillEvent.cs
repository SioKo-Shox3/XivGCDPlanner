using System;

namespace XivGCDPlanner.Models
{
    /// <summary>
    /// タイムライン上のスキル使用イベント
    /// </summary>
    public class SkillEvent
    {
        /// <summary>
        /// 使用時刻（秒）
        /// </summary>
        public double Time { get; set; }

        /// <summary>
        /// 使用するスキル
        /// </summary>
        public SkillBase Skill { get; set; } = null!;

        /// <summary>
        /// イベントの種類
        /// </summary>
        public SkillEventType EventType { get; set; }

        /// <summary>
        /// このイベントが実行可能かどうか
        /// </summary>
        public bool IsExecutable { get; set; } = true;

        /// <summary>
        /// エラーメッセージ（実行不可能な場合）
        /// </summary>
        public string? ErrorMessage { get; set; }

        /// <summary>
        /// コンストラクタ
        /// </summary>
        /// <param name="time">使用時刻</param>
        /// <param name="skill">使用するスキル</param>
        /// <param name="eventType">イベントの種類</param>
        public SkillEvent(double time, SkillBase skill, SkillEventType eventType = SkillEventType.SkillUse)
        {
            Time = time;
            Skill = skill;
            EventType = eventType;
        }

        /// <summary>
        /// イベントの表示用文字列
        /// </summary>
        /// <returns>表示用文字列</returns>
        public override string ToString()
        {
            string status = IsExecutable ? "✓" : "✗";
            string errorInfo = !IsExecutable && !string.IsNullOrEmpty(ErrorMessage) ? $" ({ErrorMessage})" : "";
            return $"{Time:F2}s: {status} {Skill.Name}{errorInfo}";
        }
    }

    /// <summary>
    /// スキルイベントの種類
    /// </summary>
    public enum SkillEventType
    {
        /// <summary>
        /// スキル使用
        /// </summary>
        SkillUse,
        
        /// <summary>
        /// GCDクールダウン終了
        /// </summary>
        GcdReady,
        
        /// <summary>
        /// アビリティリキャスト終了
        /// </summary>
        AbilityReady
    }
}
