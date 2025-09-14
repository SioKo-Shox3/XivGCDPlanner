using System;

namespace XivGCDPlanner.Models
{
    /// <summary>
    /// 全てのスキルの基底クラス
    /// </summary>
    public abstract class SkillBase
    {
        /// <summary>
        /// スキル名
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// スキルID（FF14内部ID）
        /// </summary>
        public int SkillId { get; set; }

        /// <summary>
        /// 詠唱時間（秒）
        /// </summary>
        public double CastTime { get; set; }

        /// <summary>
        /// ポテンシー（攻撃力）
        /// </summary>
        public int Potency { get; set; }

        /// <summary>
        /// スキルアイコンのパス
        /// </summary>
        public string? IconPath { get; set; }

        /// <summary>
        /// スキルの説明
        /// </summary>
        public string Description { get; set; } = string.Empty;

        /// <summary>
        /// このスキルが使用可能かどうかを判定
        /// </summary>
        /// <param name="currentTime">現在時刻</param>
        /// <returns>使用可能な場合true</returns>
        public abstract bool CanUse(double currentTime);

        /// <summary>
        /// スキル使用後の処理
        /// </summary>
        /// <param name="useTime">使用時刻</param>
        public abstract void Use(double useTime);
    }
}
