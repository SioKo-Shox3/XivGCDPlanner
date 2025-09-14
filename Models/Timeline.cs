using System;
using System.Collections.Generic;
using System.Linq;

namespace XivGCDPlanner.Models
{
    /// <summary>
    /// 戦闘タイムラインを管理するクラス
    /// </summary>
    public class Timeline
    {
        /// <summary>
        /// スキルイベントのリスト
        /// </summary>
        public List<SkillEvent> Events { get; private set; } = new List<SkillEvent>();

        /// <summary>
        /// 利用可能なGCDスキルのリスト
        /// </summary>
        public List<GcdSkill> GcdSkills { get; private set; } = new List<GcdSkill>();

        /// <summary>
        /// 利用可能なアビリティのリスト
        /// </summary>
        public List<AbilitySkill> AbilitySkills { get; private set; } = new List<AbilitySkill>();

        /// <summary>
        /// タイムラインの総時間（秒）
        /// </summary>
        public double TotalTime { get; set; } = 300.0; // デフォルト5分

        /// <summary>
        /// スペルスピード値
        /// </summary>
        public int SpellSpeed { get; set; } = 400; // FF14のデフォルトスペルスピード

        /// <summary>
        /// スペルスピードによるGCD短縮率を計算
        /// </summary>
        public double SpellSpeedModifier => CalculateSpellSpeedModifier(SpellSpeed);

        /// <summary>
        /// GCDスキルを追加
        /// </summary>
        /// <param name="skill">追加するGCDスキル</param>
        public void AddGcdSkill(GcdSkill skill)
        {
            skill.SpellSpeedModifier = SpellSpeedModifier;
            GcdSkills.Add(skill);
        }

        /// <summary>
        /// アビリティを追加
        /// </summary>
        /// <param name="ability">追加するアビリティ</param>
        public void AddAbilitySkill(AbilitySkill ability)
        {
            AbilitySkills.Add(ability);
        }

        /// <summary>
        /// 指定時刻にスキルを使用するイベントを追加
        /// </summary>
        /// <param name="time">使用時刻</param>
        /// <param name="skill">使用するスキル</param>
        /// <returns>追加されたイベント</returns>
        public SkillEvent AddSkillEvent(double time, SkillBase skill)
        {
            var skillEvent = new SkillEvent(time, skill);
            Events.Add(skillEvent);
            Events.Sort((a, b) => a.Time.CompareTo(b.Time));
            
            ValidateTimeline();
            return skillEvent;
        }

        /// <summary>
        /// イベントを削除
        /// </summary>
        /// <param name="skillEvent">削除するイベント</param>
        public void RemoveSkillEvent(SkillEvent skillEvent)
        {
            Events.Remove(skillEvent);
            ValidateTimeline();
        }

        /// <summary>
        /// タイムラインを検証し、実行可能性をチェック
        /// </summary>
        public void ValidateTimeline()
        {
            // 全スキルの状態をリセット
            ResetAllSkills();

            foreach (var skillEvent in Events.OrderBy(e => e.Time))
            {
                try
                {
                    if (skillEvent.Skill.CanUse(skillEvent.Time))
                    {
                        skillEvent.Skill.Use(skillEvent.Time);
                        skillEvent.IsExecutable = true;
                        skillEvent.ErrorMessage = null;
                    }
                    else
                    {
                        skillEvent.IsExecutable = false;
                        skillEvent.ErrorMessage = GetUnavailabilityReason(skillEvent.Skill, skillEvent.Time);
                    }
                }
                catch (Exception ex)
                {
                    skillEvent.IsExecutable = false;
                    skillEvent.ErrorMessage = ex.Message;
                }
            }
        }

        /// <summary>
        /// 指定時刻で使用可能なスキルのリストを取得
        /// </summary>
        /// <param name="time">時刻</param>
        /// <returns>使用可能なスキルのリスト</returns>
        public List<SkillBase> GetAvailableSkills(double time)
        {
            var availableSkills = new List<SkillBase>();

            // 一時的に全スキルの状態をリセットして、指定時刻までのイベントを実行
            ResetAllSkills();
            foreach (var skillEvent in Events.Where(e => e.Time < time).OrderBy(e => e.Time))
            {
                if (skillEvent.Skill.CanUse(skillEvent.Time))
                {
                    skillEvent.Skill.Use(skillEvent.Time);
                }
            }

            // 指定時刻で使用可能なスキルを収集
            availableSkills.AddRange(GcdSkills.Where(s => s.CanUse(time)));
            availableSkills.AddRange(AbilitySkills.Where(s => s.CanUse(time)));

            return availableSkills;
        }

        /// <summary>
        /// タイムライン統計を取得
        /// </summary>
        /// <returns>統計情報</returns>
        public TimelineStatistics GetStatistics()
        {
            var stats = new TimelineStatistics();
            
            var executableEvents = Events.Where(e => e.IsExecutable).ToList();
            
            stats.TotalSkillUses = executableEvents.Count;
            stats.GcdSkillUses = executableEvents.Count(e => e.Skill is GcdSkill);
            stats.AbilityUses = executableEvents.Count(e => e.Skill is AbilitySkill);
            stats.TotalPotency = executableEvents.Sum(e => e.Skill.Potency);
            stats.PotencyPerSecond = TotalTime > 0 ? stats.TotalPotency / TotalTime : 0;
            
            return stats;
        }

        /// <summary>
        /// 全スキルの状態をリセット
        /// </summary>
        private void ResetAllSkills()
        {
            foreach (var skill in GcdSkills)
            {
                // リフレクションを使用してプライベートフィールドをリセット
                var field = typeof(GcdSkill).GetField("<LastGcdUseTime>k__BackingField", 
                    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
                field?.SetValue(skill, -1.0);
            }

            foreach (var ability in AbilitySkills)
            {
                // リフレクションを使用してプライベートフィールドをリセット
                var lastUseField = typeof(AbilitySkill).GetField("<LastUseTime>k__BackingField",
                    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
                var chargesField = typeof(AbilitySkill).GetField("<CurrentCharges>k__BackingField",
                    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
                
                lastUseField?.SetValue(ability, -1.0);
                chargesField?.SetValue(ability, ability.MaxCharges);
            }
        }

        /// <summary>
        /// スキルが使用できない理由を取得
        /// </summary>
        /// <param name="skill">スキル</param>
        /// <param name="time">時刻</param>
        /// <returns>使用できない理由</returns>
        private string GetUnavailabilityReason(SkillBase skill, double time)
        {
            if (skill is GcdSkill gcdSkill)
            {
                double remainingGcd = gcdSkill.GetRemainingGcdTime(time);
                if (remainingGcd > 0)
                {
                    return $"GCDあと{remainingGcd:F2}秒";
                }
            }
            else if (skill is AbilitySkill abilitySkill)
            {
                double remainingRecast = abilitySkill.GetRemainingRecastTime(time);
                if (remainingRecast > 0)
                {
                    return $"リキャストあと{remainingRecast:F2}秒";
                }
            }

            return "使用不可";
        }

        /// <summary>
        /// スペルスピードによるGCD短縮率を計算
        /// </summary>
        /// <param name="spellSpeed">スペルスピード値</param>
        /// <returns>GCD短縮率（1.0未満の値）</returns>
        private static double CalculateSpellSpeedModifier(int spellSpeed)
        {
            // FF14のスペルスピード計算式（近似）
            // 基準値400から始まり、スペルスピードが増加するとGCDが短縮される
            const double baseSpellSpeed = 400.0;
            const double speedCoefficient = 130.0;
            
            if (spellSpeed <= baseSpellSpeed)
                return 1.0;
            
            double modifier = (spellSpeed - baseSpellSpeed) / speedCoefficient;
            return Math.Max(0.5, 1.0 - (modifier * 0.01)); // 最大50%短縮
        }
    }

    /// <summary>
    /// タイムライン統計情報
    /// </summary>
    public class TimelineStatistics
    {
        public int TotalSkillUses { get; set; }
        public int GcdSkillUses { get; set; }
        public int AbilityUses { get; set; }
        public int TotalPotency { get; set; }
        public double PotencyPerSecond { get; set; }
    }
}
