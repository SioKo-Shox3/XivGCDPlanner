using System;

namespace XivGCDPlanner.Models
{
    /// <summary>
    /// GCD（グローバルクールダウン）スキル
    /// 使用後、スペルスピードに依存したグローバルクールダウンが発生
    /// </summary>
    public class GcdSkill : SkillBase
    {
        /// <summary>
        /// 基本GCD時間（秒）
        /// </summary>
        public double BaseGcdTime { get; set; } = 2.5;

        /// <summary>
        /// 最後にGCDを使用した時刻
        /// </summary>
        public double LastGcdUseTime { get; private set; } = -1;

        /// <summary>
        /// スペルスピードによるGCD短縮率
        /// </summary>
        public double SpellSpeedModifier { get; set; } = 1.0;

        /// <summary>
        /// 実際のGCD時間を計算
        /// </summary>
        public double ActualGcdTime => BaseGcdTime * SpellSpeedModifier;

        /// <summary>
        /// 次にGCDスキルが使用可能になる時刻
        /// </summary>
        public double NextGcdAvailableTime => LastGcdUseTime < 0 ? 0 : LastGcdUseTime + ActualGcdTime;

        /// <summary>
        /// 現在時刻でGCDスキルが使用可能かどうか
        /// </summary>
        /// <param name="currentTime">現在時刻</param>
        /// <returns>使用可能な場合true</returns>
        public override bool CanUse(double currentTime)
        {
            return currentTime >= NextGcdAvailableTime;
        }

        /// <summary>
        /// GCDスキルを使用
        /// </summary>
        /// <param name="useTime">使用時刻</param>
        public override void Use(double useTime)
        {
            if (!CanUse(useTime))
            {
                throw new InvalidOperationException($"スキル '{Name}' は時刻 {useTime:F2} では使用できません。次回使用可能時刻: {NextGcdAvailableTime:F2}");
            }

            LastGcdUseTime = useTime;
        }

        /// <summary>
        /// GCDの残り時間を取得
        /// </summary>
        /// <param name="currentTime">現在時刻</param>
        /// <returns>残り時間（秒）</returns>
        public double GetRemainingGcdTime(double currentTime)
        {
            if (LastGcdUseTime < 0)
                return 0;

            double remaining = NextGcdAvailableTime - currentTime;
            return Math.Max(0, remaining);
        }
    }
}
