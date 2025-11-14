from django.core.management.base import BaseCommand
from api.models import User, Skill
import random
from datetime import date, timedelta
import csv

class Command(BaseCommand):
    help = 'Populate database with 50 students and 50 professionals'

    def handle(self, *args, **kwargs):
        self.stdout.write('Clearing existing test users...')
        User.objects.filter(username__startswith='student').delete()
        User.objects.filter(username__startswith='prof').delete()
        self.stdout.write('Cleared existing users.')

        tech_skills = ['Python', 'JavaScript', 'Java', 'React', 'Django', 'Node.js', 'SQL', 
                       'Machine Learning', 'Data Science', 'Cloud Computing', 'AWS', 'Docker',
                       'Kubernetes', 'Go', 'Rust', 'TypeScript', 'Vue.js', 'Angular']
        
        business_skills = ['Project Management', 'Marketing', 'Sales', 'Leadership', 
                          'Business Strategy', 'Finance', 'Accounting', 'HR Management',
                          'Product Management', 'Public Speaking', 'Negotiation']
        
        creative_skills = ['Graphic Design', 'UI/UX Design', 'Video Editing', 'Photography',
                          'Content Writing', 'Copywriting', 'Animation', '3D Modeling']
        
        soft_skills = ['Communication', 'Team Collaboration', 'Problem Solving', 
                      'Critical Thinking', 'Time Management', 'Adaptability']
        
        all_skills = tech_skills + business_skills + creative_skills + soft_skills

        for skill_name in all_skills:
            Skill.objects.get_or_create(name=skill_name)

        major_cities = [
            ('New York', 'NY', 'USA'),
            ('San Francisco', 'CA', 'USA'),
            ('Los Angeles', 'CA', 'USA'),
            ('Boston', 'MA', 'USA'),
            ('Seattle', 'WA', 'USA'),
            ('Chicago', 'IL', 'USA'),
            ('Austin', 'TX', 'USA'),
            ('Denver', 'CO', 'USA'),
        ]
        
        remote_locations = [
            ('Tokyo', '', 'Japan'),
            ('London', '', 'UK'),
            ('Berlin', '', 'Germany'),
            ('Sydney', '', 'Australia'),
        ]

        first_names_male = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 
                           'Joseph', 'Thomas', 'Christopher', 'Daniel', 'Matthew', 'Anthony',
                           'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth']
        
        first_names_female = ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara',
                             'Susan', 'Jessica', 'Sarah', 'Karen', 'Nancy', 'Lisa', 'Betty',
                             'Margaret', 'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle']
        
        last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
                     'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
                     'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
                     'Lee', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez']

        credentials = []

        self.stdout.write('Creating 50 students...')
        for i in range(50):
            is_female = random.choice([True, False])
            first_name = random.choice(first_names_female if is_female else first_names_male)
            last_name = random.choice(last_names)
            username = f'student{i+1}'
            password = f'pass{i+1}'
            email = f'{username}@example.com'
            
            age = random.randint(18, 25)
            birth_date = date.today() - timedelta(days=age*365 + random.randint(0, 364))
            
            if random.random() < 0.9:
                city, state, country = random.choice(major_cities)
            else:
                city, state, country = random.choice(remote_locations)

            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                role='student',
                first_name=first_name,
                last_name=last_name,
                date_of_birth=birth_date,
                city=city,
                state=state,
                country=country,
                bio=f"I'm a {age}-year-old student passionate about learning and growing. Looking for mentorship to advance my career."
            )
            
            num_needed = random.randint(2, 5)
            needed_skills = random.sample(all_skills, num_needed)
            for skill_name in needed_skills:
                skill = Skill.objects.get(name=skill_name)
                user.skills_needed.add(skill)
            
            num_offered = random.randint(1, 3)
            available_for_offer = [s for s in all_skills if s not in needed_skills]
            offered_skills = random.sample(available_for_offer, min(num_offered, len(available_for_offer)))
            for skill_name in offered_skills:
                skill = Skill.objects.get(name=skill_name)
                user.skills_offered.add(skill)
            
            credentials.append({
                'username': username,
                'password': password,
                'email': email,
                'role': 'student',
                'name': f'{first_name} {last_name}',
                'location': f'{city}, {state + ", " if state else ""}{country}',
                'age': age
            })
            
            if (i + 1) % 10 == 0:
                self.stdout.write(f'Created {i+1} students...')

        self.stdout.write('Creating 50 professionals...')
        for i in range(50):
            is_female = random.choice([True, False])
            first_name = random.choice(first_names_female if is_female else first_names_male)
            last_name = random.choice(last_names)
            username = f'prof{i+1}'
            password = f'pass{i+1}'
            email = f'{username}@example.com'
            
            age = random.randint(28, 55)
            birth_date = date.today() - timedelta(days=age*365 + random.randint(0, 364))

            if random.random() < 0.85:
                city, state, country = random.choice(major_cities)
            else:
                city, state, country = random.choice(remote_locations)

            is_verified = random.random() < 0.7
            
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                role='professional',
                first_name=first_name,
                last_name=last_name,
                date_of_birth=birth_date,
                city=city,
                state=state,
                country=country,
                is_verified=is_verified,
                bio=f"Experienced professional with {age-22} years in the industry. Happy to mentor and share knowledge."
            )
            
            num_offered = random.randint(3, 7)
            offered_skills = random.sample(all_skills, num_offered)
            for skill_name in offered_skills:
                skill = Skill.objects.get(name=skill_name)
                user.skills_offered.add(skill)

            num_needed = random.randint(1, 3)

            available_for_need = [s for s in all_skills if s not in offered_skills]
            needed_skills = random.sample(available_for_need, min(num_needed, len(available_for_need)))
            for skill_name in needed_skills:
                skill = Skill.objects.get(name=skill_name)
                user.skills_needed.add(skill)
            
            credentials.append({
                'username': username,
                'password': password,
                'email': email,
                'role': 'professional',
                'name': f'{first_name} {last_name}',
                'location': f'{city}, {state + ", " if state else ""}{country}',
                'age': age,
                'verified': 'Yes' if is_verified else 'No'
            })
            
            if (i + 1) % 10 == 0:
                self.stdout.write(f'Created {i+1} professionals...')

        csv_path = '/Users/lennonrozo/Desktop/mentormatch/test_user_credentials.csv'
        with open(csv_path, 'w', newline='') as csvfile:
            fieldnames = ['username', 'password', 'email', 'role', 'name', 'location', 'age', 'verified']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            
            writer.writeheader()
            for cred in credentials:
                writer.writerow(cred)

        self.stdout.write(self.style.SUCCESS(f'\nSuccessfully created 100 users!'))
        self.stdout.write(self.style.SUCCESS(f'Credentials saved to: {csv_path}'))
        self.stdout.write('\nSummary:')
        self.stdout.write(f'- 50 students created')
        self.stdout.write(f'- 50 professionals created (70% verified)')
        self.stdout.write(f'- Skills varied across tech, business, creative, and soft skills')
        self.stdout.write(f'- Most users in major US cities, some international')
        self.stdout.write(f'- Skill intersections created for matching')
